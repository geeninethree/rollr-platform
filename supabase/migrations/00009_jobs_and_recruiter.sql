-- Job board + recruiter role
-- Run after 00008.

-- ─── Roles ───────────────────────────────────────────────────────────────────
do $$ begin
  alter type public.user_role add value if not exists 'recruiter';
exception
  when duplicate_object then null;
end $$;

-- Recruiter subscription (₹399/mo when billing live; alpha: set active manually)
alter table public.profiles
  add column if not exists recruiter_sub_status text
    default 'inactive'
    check (recruiter_sub_status in ('inactive', 'active', 'past_due'));

-- ─── Open jobs (board) ───────────────────────────────────────────────────────
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  poster_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  brief_type text not null default 'shoot'
    check (brief_type in ('shoot', 'edit', 'full_package')),
  location text not null default '',
  category text not null default '',
  event_date text default '',
  budget text,
  poster_name text not null,
  poster_whatsapp text not null,
  poster_email text,
  status text not null default 'open'
    check (status in ('open', 'closed', 'filled')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  closed_at timestamptz
);

create index if not exists jobs_status_idx on public.jobs (status, created_at desc);
create index if not exists jobs_poster_idx on public.jobs (poster_id, status);

alter table public.jobs enable row level security;

-- Anyone can read open jobs (public board) — contact not needed for list
create policy "Public read open jobs"
  on public.jobs for select
  using (
    status = 'open'
    or poster_id = auth.uid()
    or public.is_rollr_admin()
  );

create policy "Authenticated insert jobs"
  on public.jobs for insert
  to authenticated
  with check (poster_id = auth.uid());

create policy "Poster update own jobs"
  on public.jobs for update
  to authenticated
  using (poster_id = auth.uid() or public.is_rollr_admin())
  with check (poster_id = auth.uid() or public.is_rollr_admin());

-- Enforce: free users max 1 open job (recruiter active unlimited)
create or replace function public.enforce_job_open_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  open_count int;
  is_recruiter_active boolean;
begin
  if new.status is distinct from 'open' then
    return new;
  end if;

  select (
    p.role = 'recruiter'
    and coalesce(p.recruiter_sub_status, 'inactive') = 'active'
  )
  into is_recruiter_active
  from public.profiles p
  where p.id = new.poster_id;

  if coalesce(is_recruiter_active, false) then
    return new;
  end if;

  select count(*)::int into open_count
  from public.jobs j
  where j.poster_id = new.poster_id
    and j.status = 'open'
    and (tg_op = 'INSERT' or j.id is distinct from new.id);

  if open_count >= 1 then
    raise exception 'FREE_JOB_LIMIT: Close your open job first, or upgrade to Recruiter (₹399/mo) for multiple open posts.';
  end if;

  return new;
end;
$$;

drop trigger if exists jobs_open_limit on public.jobs;
create trigger jobs_open_limit
  before insert or update of status on public.jobs
  for each row execute procedure public.enforce_job_open_limit();

-- ─── Pitches (creators apply; same privacy model as briefs) ───────────────────
create table if not exists public.job_pitches (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  creator_user_id uuid not null references public.profiles(id) on delete cascade,
  creator_name text not null,
  message text not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (job_id, creator_user_id)
);

create index if not exists job_pitches_job_idx on public.job_pitches (job_id, status);

alter table public.job_pitches enable row level security;

-- Poster sees pitches on their jobs; creator sees own pitches
create policy "Pitch participants read"
  on public.job_pitches for select
  to authenticated
  using (
    creator_user_id = auth.uid()
    or exists (
      select 1 from public.jobs j
      where j.id = job_pitches.job_id and j.poster_id = auth.uid()
    )
    or public.is_rollr_admin()
  );

create policy "Creators insert pitch"
  on public.job_pitches for insert
  to authenticated
  with check (creator_user_id = auth.uid());

-- Poster accepts/declines; creator cannot fake accept
create policy "Poster update pitch status"
  on public.job_pitches for update
  to authenticated
  using (
    exists (
      select 1 from public.jobs j
      where j.id = job_pitches.job_id and j.poster_id = auth.uid()
    )
    or public.is_rollr_admin()
  );

-- After accept: creator may read poster_whatsapp via job select (already poster_id or open)
-- Expose poster contact only after accept — use security definer helper
create or replace function public.job_poster_contact_after_accept(p_pitch_id uuid)
returns table (poster_whatsapp text, poster_name text, job_title text)
language sql
stable
security definer
set search_path = public
as $$
  select j.poster_whatsapp, j.poster_name, j.title
  from public.job_pitches p
  join public.jobs j on j.id = p.job_id
  where p.id = p_pitch_id
    and p.status = 'accepted'
    and p.creator_user_id = auth.uid();
$$;

grant execute on function public.job_poster_contact_after_accept(uuid) to authenticated;
