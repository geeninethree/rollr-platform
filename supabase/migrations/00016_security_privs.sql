-- Production privilege hardening (run after 00001–00015)
-- 1) Lock is_admin / recruiter_sub_status on profiles for non-admins
-- 2) Lock listing_status / is_featured on creator_profiles for non-admins
-- 3) Narrow public profile read to published creators only (no email harvest via join)
-- 4) Waitlist insert: pending only, no admin fields
-- 5) Revoke creator_notify_email from anon/authenticated (service role only)
-- 6) Pitch participants: no contact columns (use view + drop full-row policy)

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Profiles: freeze privileged columns unless already admin
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.protect_profile_privs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_is_admin boolean;
begin
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  ) into caller_is_admin;

  -- Only admins (or service role with null uid) may change is_admin
  if auth.uid() is not null and not caller_is_admin then
    new.is_admin := old.is_admin;
  end if;

  -- Non-admins cannot activate multi-job recruiter status
  if auth.uid() is not null and not caller_is_admin then
    if coalesce(new.recruiter_sub_status, 'inactive') = 'active'
       and coalesce(old.recruiter_sub_status, 'inactive') is distinct from 'active' then
      new.recruiter_sub_status := old.recruiter_sub_status;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_privs_trg on public.profiles;
create trigger protect_profile_privs_trg
  before update on public.profiles
  for each row execute procedure public.protect_profile_privs();

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Creator listings: no self-publish / self-feature
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.protect_listing_privs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_is_admin boolean;
begin
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  ) into caller_is_admin;

  if auth.uid() is not null and not caller_is_admin then
    -- Never allow non-admin to set published or is_featured true
    if tg_op = 'INSERT' then
      if new.listing_status = 'published' then
        new.listing_status := 'pending_review';
      end if;
      new.is_featured := false;
    elsif tg_op = 'UPDATE' then
      if new.listing_status = 'published'
         and old.listing_status is distinct from 'published' then
        -- Allow stay on pending_review / draft / rejected only via app intent
        if old.listing_status in ('draft', 'rejected') then
          new.listing_status := 'pending_review';
        else
          new.listing_status := old.listing_status;
        end if;
      end if;
      -- Cannot clear rejected → published; admin only
      if old.listing_status = 'published' and new.listing_status is distinct from 'published' then
        -- owners may unpublish to draft
        if new.listing_status not in ('draft', 'pending_review') then
          new.listing_status := 'draft';
        end if;
      end if;
      if coalesce(new.is_featured, false) and not coalesce(old.is_featured, false) then
        new.is_featured := old.is_featured;
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_listing_privs_trg on public.creator_profiles;
create trigger protect_listing_privs_trg
  before insert or update on public.creator_profiles
  for each row execute procedure public.protect_listing_privs();

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Public profile read: only published listings (hide email harvest surface)
-- ═══════════════════════════════════════════════════════════════════════════
drop policy if exists "Profiles: read creator profiles for directory" on public.profiles;

create policy "Profiles: read published creators public fields"
  on public.profiles for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.creator_profiles cp
      where cp.profile_id = profiles.id
        and cp.listing_status = 'published'
    )
    or id = auth.uid()
    or public.is_rollr_admin()
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. Waitlist insert: pending only
-- ═══════════════════════════════════════════════════════════════════════════
drop policy if exists "Anyone can insert waitlist" on public.waitlist_signups;
drop policy if exists "Public insert waitlist" on public.waitlist_signups;
drop policy if exists "Anon insert waitlist" on public.waitlist_signups;
drop policy if exists "Anyone can join waitlist" on public.waitlist_signups;
drop policy if exists "Waitlist: public insert" on public.waitlist_signups;

create policy "Waitlist: insert pending only"
  on public.waitlist_signups for insert
  to anon, authenticated
  with check (
    coalesce(status, 'pending') = 'pending'
    and admin_notes is null
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. Notify RPC: service role only (no anon email harvest)
-- ═══════════════════════════════════════════════════════════════════════════
revoke all on function public.creator_notify_email(uuid) from public;
revoke all on function public.creator_notify_email(uuid) from anon;
revoke all on function public.creator_notify_email(uuid) from authenticated;
-- service_role keeps access by default in Supabase

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. Jobs: pitchers use safe view without contact columns
-- ═══════════════════════════════════════════════════════════════════════════
create or replace view public.jobs_for_pitchers
with (security_invoker = true)
as
select
  j.id,
  j.poster_id,
  j.title,
  j.description,
  j.brief_type,
  j.location,
  j.category,
  j.event_date,
  j.budget,
  j.poster_name,
  j.status,
  j.created_at,
  j.updated_at,
  j.closed_at
from public.jobs j
where exists (
  select 1 from public.job_pitches p
  where p.job_id = j.id
    and p.creator_user_id = auth.uid()
);

grant select on public.jobs_for_pitchers to authenticated;

drop policy if exists "Jobs: pitch participants read row" on public.jobs;

-- Pitchers no longer get full jobs row (no whatsapp/email).
-- They use jobs_for_pitchers view; contact still via job_poster_contact_after_accept RPC.
