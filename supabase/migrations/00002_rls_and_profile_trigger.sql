-- Enable RLS + auto profile on signup (run after 00001_init.sql)

alter table public.profiles enable row level security;
alter table public.creator_profiles enable row level security;

-- Profiles: users can read any published creator's profile later;
-- for now: read own; creators/clients can read profiles linked to public creators.
create policy "Profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

-- Allow authenticated users to read profiles of listed creators (directory)
create policy "Profiles: read creator profiles for directory"
  on public.profiles for select
  using (
    exists (
      select 1 from public.creator_profiles cp
      where cp.profile_id = profiles.id
    )
  );

-- Creator profiles
create policy "Creator profiles: public read"
  on public.creator_profiles for select
  using (true);

create policy "Creator profiles: insert own"
  on public.creator_profiles for insert
  with check (
    auth.uid() = profile_id
  );

create policy "Creator profiles: update own"
  on public.creator_profiles for update
  using (auth.uid() = profile_id);

-- Auto-create public.profiles when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'client'::public.user_role)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
