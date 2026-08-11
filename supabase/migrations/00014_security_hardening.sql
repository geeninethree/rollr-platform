-- Security hardening for public alpha
-- 1) Creator listings: public read published only
-- 2) Reviews: insert only via token-validated RPC
-- 3) Inquiries: no public select by review_token; safe RPC for review page
-- 4) Rate limits: waitlist + briefs by email/whatsapp

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Creator profiles — public only sees published
-- ═══════════════════════════════════════════════════════════════════════════
drop policy if exists "Creator profiles: public read" on public.creator_profiles;

create policy "Creator profiles: public read published"
  on public.creator_profiles for select
  to anon, authenticated
  using (
    listing_status = 'published'
    or profile_id = auth.uid()
    or public.is_rollr_admin()
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Reviews — drop open insert; token RPC only
-- ═══════════════════════════════════════════════════════════════════════════
drop policy if exists "Anyone can insert review" on public.reviews;

-- Authenticated/anon cannot insert directly; only security definer function
create policy "No direct review inserts"
  on public.reviews for insert
  to anon, authenticated
  with check (false);

create or replace function public.submit_review_with_token(
  p_token text,
  p_rating integer,
  p_body text default null,
  p_is_success_story boolean default false,
  p_success_quote text default null,
  p_client_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inq public.inquiries%rowtype;
  v_review_id uuid;
  v_name text;
begin
  if p_token is null or length(trim(p_token)) < 16 then
    raise exception 'INVALID_TOKEN';
  end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'INVALID_RATING';
  end if;

  select * into v_inq
  from public.inquiries
  where review_token = trim(p_token)
  limit 1;

  if not found then
    raise exception 'INVALID_TOKEN';
  end if;

  if v_inq.review_token_expires_at is not null
     and v_inq.review_token_expires_at < timezone('utc'::text, now()) then
    raise exception 'TOKEN_EXPIRED';
  end if;

  if v_inq.status is distinct from 'accepted' then
    raise exception 'NOT_ACCEPTED';
  end if;

  if exists (select 1 from public.reviews r where r.inquiry_id = v_inq.id) then
    raise exception 'ALREADY_REVIEWED';
  end if;

  v_name := coalesce(nullif(trim(p_client_name), ''), v_inq.client_name, 'Client');

  insert into public.reviews (
    creator_id,
    inquiry_id,
    client_name,
    client_email,
    rating,
    body,
    is_success_story,
    success_quote,
    status
  ) values (
    v_inq.creator_id,
    v_inq.id,
    v_name,
    v_inq.client_email,
    p_rating,
    nullif(trim(p_body), ''),
    coalesce(p_is_success_story, false),
    nullif(trim(p_success_quote), ''),
    'published'
  )
  returning id into v_review_id;

  return v_review_id;
end;
$$;

revoke all on function public.submit_review_with_token(text, integer, text, boolean, text, text) from public;
grant execute on function public.submit_review_with_token(text, integer, text, boolean, text, text)
  to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Inquiry review token — no broad public select (leaks WhatsApp)
-- ═══════════════════════════════════════════════════════════════════════════
drop policy if exists "Public read inquiries with review token" on public.inquiries;

create or replace function public.get_inquiry_for_review_token(p_token text)
returns table (
  id uuid,
  creator_id uuid,
  creator_name text,
  client_name text,
  category text,
  location text,
  review_token_expires_at timestamptz,
  job_completed_at timestamptz,
  already_reviewed boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_inq public.inquiries%rowtype;
begin
  if p_token is null or length(trim(p_token)) < 16 then
    return;
  end if;

  select * into v_inq
  from public.inquiries
  where review_token = trim(p_token)
  limit 1;

  if not found then
    return;
  end if;

  if v_inq.review_token_expires_at is not null
     and v_inq.review_token_expires_at < timezone('utc'::text, now()) then
    return;
  end if;

  id := v_inq.id;
  creator_id := v_inq.creator_id;
  creator_name := v_inq.creator_name;
  client_name := v_inq.client_name;
  category := v_inq.category;
  location := v_inq.location;
  review_token_expires_at := v_inq.review_token_expires_at;
  job_completed_at := v_inq.job_completed_at;
  already_reviewed := exists (
    select 1 from public.reviews r where r.inquiry_id = v_inq.id
  );
  return next;
end;
$$;

revoke all on function public.get_inquiry_for_review_token(text) from public;
grant execute on function public.get_inquiry_for_review_token(text) to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. Rate limits (spam on waitlist + briefs)
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.enforce_waitlist_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  select count(*)::int into n
  from public.waitlist_signups w
  where lower(w.email) = lower(new.email)
    and w.created_at > timezone('utc'::text, now()) - interval '1 hour';

  if n >= 3 then
    raise exception 'RATE_LIMIT: Too many waitlist signups for this email. Try again later.';
  end if;
  return new;
end;
$$;

drop trigger if exists waitlist_rate_limit on public.waitlist_signups;
create trigger waitlist_rate_limit
  before insert on public.waitlist_signups
  for each row execute procedure public.enforce_waitlist_rate_limit();

create or replace function public.enforce_inquiry_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
  wa text;
begin
  wa := regexp_replace(coalesce(new.client_whatsapp, ''), '\D', '', 'g');

  select count(*)::int into n
  from public.inquiries i
  where i.created_at > timezone('utc'::text, now()) - interval '1 hour'
    and (
      (new.client_email is not null and lower(i.client_email) = lower(new.client_email))
      or (
        length(wa) >= 10
        and regexp_replace(coalesce(i.client_whatsapp, ''), '\D', '', 'g') = wa
      )
    );

  if n >= 8 then
    raise exception 'RATE_LIMIT: Too many briefs from this contact. Try again later.';
  end if;

  -- Also cap per creator per hour (same client hammering one listing)
  select count(*)::int into n
  from public.inquiries i
  where i.creator_id = new.creator_id
    and i.created_at > timezone('utc'::text, now()) - interval '1 hour'
    and (
      (new.client_email is not null and lower(i.client_email) = lower(new.client_email))
      or (
        length(wa) >= 10
        and regexp_replace(coalesce(i.client_whatsapp, ''), '\D', '', 'g') = wa
      )
    );

  if n >= 5 then
    raise exception 'RATE_LIMIT: Too many briefs to this creator. Try again later.';
  end if;

  return new;
end;
$$;

drop trigger if exists inquiry_rate_limit on public.inquiries;
create trigger inquiry_rate_limit
  before insert on public.inquiries
  for each row execute procedure public.enforce_inquiry_rate_limit();

-- Only allow briefs to published (or own draft while testing as creator owner)
-- Actually clients brief published creators — reject briefs to non-published
create or replace function public.enforce_inquiry_published_creator()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  st text;
begin
  select listing_status into st
  from public.creator_profiles
  where id = new.creator_id;

  if st is null then
    raise exception 'CREATOR_NOT_FOUND';
  end if;
  if st is distinct from 'published' then
    raise exception 'CREATOR_NOT_PUBLIC: This creator is not live on the directory yet.';
  end if;
  return new;
end;
$$;

drop trigger if exists inquiry_published_only on public.inquiries;
create trigger inquiry_published_only
  before insert on public.inquiries
  for each row execute procedure public.enforce_inquiry_published_creator();

comment on function public.submit_review_with_token is
  'Insert review only when token matches an accepted inquiry; no open insert policy.';
comment on function public.get_inquiry_for_review_token is
  'Safe fields for /review/[token] — never returns client_whatsapp.';
