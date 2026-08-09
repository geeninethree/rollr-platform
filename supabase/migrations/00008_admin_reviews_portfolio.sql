-- Admin RLS hardening, reviews/ratings, portfolio works storage, listing aggregates
-- Run after 00007.

-- ─── Admin flag on profiles ──────────────────────────────────────────────────
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Bootstrap: set your admin after first signup, e.g.:
-- update public.profiles set is_admin = true where email = 'tintu.gautam@gmail.com';

create or replace function public.is_rollr_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_rollr_admin() from public;
grant execute on function public.is_rollr_admin() to authenticated;

-- ─── Waitlist: only admins read/update ───────────────────────────────────────
drop policy if exists "Authenticated can read waitlist" on public.waitlist_signups;
drop policy if exists "Authenticated can update waitlist" on public.waitlist_signups;

create policy "Admins read waitlist"
  on public.waitlist_signups for select
  to authenticated
  using (public.is_rollr_admin());

create policy "Admins update waitlist"
  on public.waitlist_signups for update
  to authenticated
  using (public.is_rollr_admin())
  with check (public.is_rollr_admin());

-- ─── Creator listing aggregates ──────────────────────────────────────────────
alter table public.creator_profiles
  add column if not exists rating_avg numeric(3,2) not null default 0,
  add column if not exists review_count integer not null default 0;

-- Admins can update any listing (publish / reject)
drop policy if exists "Admins update any creator listing" on public.creator_profiles;
create policy "Admins update any creator listing"
  on public.creator_profiles for update
  to authenticated
  using (public.is_rollr_admin())
  with check (public.is_rollr_admin());

-- Notify: allow server (anon key) to resolve creator email without exposing via select *
create or replace function public.creator_notify_email(p_creator_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.email
  from public.creator_profiles cp
  join public.profiles p on p.id = cp.profile_id
  where cp.id = p_creator_id
  limit 1;
$$;

revoke all on function public.creator_notify_email(uuid) from public;
grant execute on function public.creator_notify_email(uuid) to anon, authenticated;

-- ─── Reviews ─────────────────────────────────────────────────────────────────
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  inquiry_id uuid references public.inquiries(id) on delete set null,
  client_name text not null,
  client_email text,
  rating integer not null check (rating >= 1 and rating <= 5),
  body text,
  is_success_story boolean not null default false,
  success_quote text,
  status text not null default 'published'
    check (status in ('pending', 'published', 'hidden')),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists reviews_creator_idx
  on public.reviews (creator_id, status, created_at desc);

-- One public review per inquiry when linked
create unique index if not exists reviews_inquiry_unique
  on public.reviews (inquiry_id)
  where inquiry_id is not null;

alter table public.reviews enable row level security;

create policy "Anyone reads published reviews"
  on public.reviews for select
  using (status = 'published' or public.is_rollr_admin());

-- Insert only via review token flow (service) or authenticated client with token RPC
-- Allow anon insert when status published (token validated in app) — tighten with RPC
create policy "Anyone can insert review"
  on public.reviews for insert
  to anon, authenticated
  with check (true);

create policy "Admins update reviews"
  on public.reviews for update
  to authenticated
  using (public.is_rollr_admin())
  with check (public.is_rollr_admin());

-- ─── Review invite tokens (leakage capture after job) ────────────────────────
alter table public.inquiries
  add column if not exists review_token text unique,
  add column if not exists review_token_expires_at timestamptz,
  add column if not exists job_completed_at timestamptz;

-- Creators need to set review token when marking complete
-- (update policy already allows creator to update own inquiries)

-- Clients open /review/[token] — allow read when a review invite exists
drop policy if exists "Public read inquiries with review token" on public.inquiries;
create policy "Public read inquiries with review token"
  on public.inquiries for select
  to anon, authenticated
  using (
    review_token is not null
    and (
      review_token_expires_at is null
      or review_token_expires_at > timezone('utc'::text, now())
    )
  );

-- ─── Recompute aggregates ────────────────────────────────────────────────────
create or replace function public.refresh_creator_rating(p_creator_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.creator_profiles cp
  set
    rating_avg = coalesce((
      select round(avg(r.rating)::numeric, 2)
      from public.reviews r
      where r.creator_id = p_creator_id and r.status = 'published'
    ), 0),
    review_count = coalesce((
      select count(*)::int
      from public.reviews r
      where r.creator_id = p_creator_id and r.status = 'published'
    ), 0)
  where cp.id = p_creator_id;
end;
$$;

create or replace function public.trg_reviews_refresh_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_creator_rating(coalesce(new.creator_id, old.creator_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists reviews_refresh_rating on public.reviews;
create trigger reviews_refresh_rating
  after insert or update or delete on public.reviews
  for each row execute procedure public.trg_reviews_refresh_rating();

-- ─── Portfolio works storage bucket ──────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio',
  'portfolio',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Portfolio are publicly readable" on storage.objects;
create policy "Portfolio are publicly readable"
  on storage.objects for select
  using (bucket_id = 'portfolio');

drop policy if exists "Users upload own portfolio" on storage.objects;
create policy "Users upload own portfolio"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users update own portfolio" on storage.objects;
create policy "Users update own portfolio"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete own portfolio" on storage.objects;
create policy "Users delete own portfolio"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Optional: set admin for known operator (safe if profile not yet created)
update public.profiles
set is_admin = true
where lower(email) = 'tintu.gautam@gmail.com';
