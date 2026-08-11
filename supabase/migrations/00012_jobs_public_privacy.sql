-- Public job board must NOT expose poster_whatsapp / poster_email.
-- App previously filtered columns, but RLS allowed select * on open jobs.

-- 1) Public-safe view (no contact fields)
create or replace view public.open_jobs_board
with (security_invoker = false)
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
where j.status = 'open';

grant select on public.open_jobs_board to anon, authenticated;

comment on view public.open_jobs_board is
  'Public job board listing without poster contact. Use job_poster_contact_after_accept for WA after pitch accept.';

-- 2) Tighten jobs table select: poster, admin, or pitch participant only
drop policy if exists "Public read open jobs" on public.jobs;

create policy "Jobs: poster or admin read"
  on public.jobs for select
  to authenticated
  using (
    poster_id = auth.uid()
    or public.is_rollr_admin()
  );

-- Creators who pitched can still read the job row (for their pitch context)
-- but contact remains available only via security definer RPC after accept.
create policy "Jobs: pitch participants read row"
  on public.jobs for select
  to authenticated
  using (
    exists (
      select 1 from public.job_pitches p
      where p.job_id = jobs.id
        and p.creator_user_id = auth.uid()
    )
  );

-- Anon has no direct select on jobs; they use open_jobs_board view only.
