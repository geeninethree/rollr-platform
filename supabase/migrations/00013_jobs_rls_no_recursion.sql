-- Fix: infinite recursion between jobs ↔ job_pitches RLS policies.
-- Cause (00012): jobs SELECT checked job_pitches; job_pitches SELECT/UPDATE checked jobs.
-- Fix: security definer helpers bypass RLS for the cross-table ownership checks.

-- ─── Helpers (bypass RLS; only return booleans for auth.uid()) ───────────────
create or replace function public.is_job_poster(p_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.jobs j
    where j.id = p_job_id
      and j.poster_id = auth.uid()
  );
$$;

create or replace function public.user_pitched_on_job(p_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.job_pitches p
    where p.job_id = p_job_id
      and p.creator_user_id = auth.uid()
  );
$$;

revoke all on function public.is_job_poster(uuid) from public;
revoke all on function public.user_pitched_on_job(uuid) from public;
grant execute on function public.is_job_poster(uuid) to authenticated;
grant execute on function public.user_pitched_on_job(uuid) to authenticated;

-- ─── jobs SELECT policies (no direct subquery into job_pitches) ──────────────
drop policy if exists "Public read open jobs" on public.jobs;
drop policy if exists "Jobs: poster or admin read" on public.jobs;
drop policy if exists "Jobs: pitch participants read row" on public.jobs;

create policy "Jobs: poster or admin read"
  on public.jobs for select
  to authenticated
  using (
    poster_id = auth.uid()
    or public.is_rollr_admin()
  );

-- Pitch participants: use definer helper (does not re-enter jobs RLS)
create policy "Jobs: pitch participants read row"
  on public.jobs for select
  to authenticated
  using (public.user_pitched_on_job(id));

-- ─── job_pitches policies (no direct subquery into jobs) ─────────────────────
drop policy if exists "Pitch participants read" on public.job_pitches;
drop policy if exists "Poster update pitch status" on public.job_pitches;

create policy "Pitch participants read"
  on public.job_pitches for select
  to authenticated
  using (
    creator_user_id = auth.uid()
    or public.is_job_poster(job_id)
    or public.is_rollr_admin()
  );

create policy "Poster update pitch status"
  on public.job_pitches for update
  to authenticated
  using (
    public.is_job_poster(job_id)
    or public.is_rollr_admin()
  )
  with check (
    public.is_job_poster(job_id)
    or public.is_rollr_admin()
  );

-- open_jobs_board view remains the public board (no contact fields)
