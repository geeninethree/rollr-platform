-- Creator interest waitlist + client → creator inquiries (WhatsApp flow)
-- Run in Supabase SQL Editor after 00001–00006.

-- ─── Waitlist (public form → you approve / invite) ───────────────────────────
create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  role text not null default 'both'
    check (role in ('shoot', 'edit', 'both')),
  primary_category text,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'contacted', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists waitlist_signups_status_idx
  on public.waitlist_signups (status, created_at desc);
create index if not exists waitlist_signups_email_idx
  on public.waitlist_signups (lower(email));

alter table public.waitlist_signups enable row level security;

-- Anyone can register interest (anon + authenticated)
drop policy if exists "Anyone can join waitlist" on public.waitlist_signups;
create policy "Anyone can join waitlist"
  on public.waitlist_signups for insert
  to anon, authenticated
  with check (true);

-- Authenticated users can read (admin UI filters by email allowlist in app)
drop policy if exists "Authenticated can read waitlist" on public.waitlist_signups;
create policy "Authenticated can read waitlist"
  on public.waitlist_signups for select
  to authenticated
  using (true);

drop policy if exists "Authenticated can update waitlist" on public.waitlist_signups;
create policy "Authenticated can update waitlist"
  on public.waitlist_signups for update
  to authenticated
  using (true)
  with check (true);

-- ─── Inquiries (Send brief → creator inbox → Accept opens WhatsApp) ──────────
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  creator_name text not null,
  client_name text not null,
  client_whatsapp text not null,
  client_email text,
  client_user_id uuid references auth.users(id) on delete set null,
  brief_type text not null
    check (brief_type in ('shoot', 'edit', 'full_package')),
  event_date text default '',
  location text default '',
  category text default '',
  budget text,
  message text not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists inquiries_creator_idx
  on public.inquiries (creator_id, status, created_at desc);

alter table public.inquiries enable row level security;

-- Clients can send briefs without an account
drop policy if exists "Anyone can create inquiry" on public.inquiries;
create policy "Anyone can create inquiry"
  on public.inquiries for insert
  to anon, authenticated
  with check (true);

-- Creator who owns the listing can read their briefs
drop policy if exists "Creators read own inquiries" on public.inquiries;
create policy "Creators read own inquiries"
  on public.inquiries for select
  to authenticated
  using (
    exists (
      select 1 from public.creator_profiles cp
      where cp.id = inquiries.creator_id
        and cp.profile_id = auth.uid()
    )
  );

-- Creator can accept / decline
drop policy if exists "Creators update own inquiries" on public.inquiries;
create policy "Creators update own inquiries"
  on public.inquiries for update
  to authenticated
  using (
    exists (
      select 1 from public.creator_profiles cp
      where cp.id = inquiries.creator_id
        and cp.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.creator_profiles cp
      where cp.id = inquiries.creator_id
        and cp.profile_id = auth.uid()
    )
  );

-- Optional: clients signed in can see briefs they sent
drop policy if exists "Clients read own sent inquiries" on public.inquiries;
create policy "Clients read own sent inquiries"
  on public.inquiries for select
  to authenticated
  using (client_user_id = auth.uid());
