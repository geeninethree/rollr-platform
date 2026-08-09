-- Creator referral program: ₹50 cashback when a referred creator publishes

alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists referred_by uuid references public.profiles(id) on delete set null;

create unique index if not exists profiles_referral_code_key
  on public.profiles (referral_code)
  where referral_code is not null;

create table if not exists public.referral_rewards (
  id uuid default gen_random_uuid() primary key,
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null references public.profiles(id) on delete cascade unique,
  amount_inr numeric not null default 50,
  status text not null default 'pending'
    check (status in ('pending', 'earned', 'paid')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  earned_at timestamptz
);

create index if not exists referral_rewards_referrer_idx
  on public.referral_rewards (referrer_id);

alter table public.referral_rewards enable row level security;

-- Referrers can read their own rewards
create policy "Referral rewards: read own as referrer"
  on public.referral_rewards for select
  using (auth.uid() = referrer_id);

-- Referred can read the row about them (optional transparency)
create policy "Referral rewards: read own as referred"
  on public.referral_rewards for select
  using (auth.uid() = referred_id);

-- Inserts/updates go through authenticated users for their own referral chain
-- (Studio will insert pending on signup path; earn on publish)
create policy "Referral rewards: insert as referred"
  on public.referral_rewards for insert
  with check (auth.uid() = referred_id);

create policy "Referral rewards: update earned by system via referred"
  on public.referral_rewards for update
  using (auth.uid() = referred_id or auth.uid() = referrer_id);

-- Profiles: allow reading referral_code of others for validation (by code lookup)
-- Already can read own; add select by authenticated for code resolve via RPC-style filter
-- Use a security definer function for code lookup instead of opening all profiles.

create or replace function public.lookup_referrer_by_code(code text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select id from public.profiles
  where referral_code = lower(trim(code))
  limit 1;
$$;

grant execute on function public.lookup_referrer_by_code(text) to anon, authenticated;

-- Helper to ensure a user has a referral code
create or replace function public.ensure_referral_code(uid uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  code text;
begin
  select referral_code into code from public.profiles where id = uid;
  if code is not null and code <> '' then
    return code;
  end if;
  code := lower(substr(replace(uid::text, '-', ''), 1, 8));
  update public.profiles set referral_code = code where id = uid;
  return code;
end;
$$;

grant execute on function public.ensure_referral_code(uuid) to authenticated;
