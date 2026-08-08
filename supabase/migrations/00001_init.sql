create type user_role as enum ('creator', 'client');
create type subscription_status as enum ('inactive', 'active', 'past_due');

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  full_name text not null,
  email text unique not null,
  phone text unique,
  role user_role default 'client'::user_role not null,
  avatar_url text
);

create table public.creator_profiles (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null unique,
  bio text,
  starting_price numeric default 0,
  cities text[] default '{Mumbai}'::text[],
  sub_regions text[] default '{}'::text[],
  categories text[] default '{}'::text[],
  is_featured boolean default false,
  sub_status subscription_status default 'inactive'::subscription_status,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index creator_search_idx on public.creator_profiles using gin (sub_regions, categories);
