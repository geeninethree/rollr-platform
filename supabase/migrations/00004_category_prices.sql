-- Category-wise starting prices (not hourly). Run after 00003.

alter table public.creator_profiles
  add column if not exists category_prices jsonb default '{}'::jsonb;

comment on column public.creator_profiles.category_prices is
  'Map of category name → starting package price in INR, e.g. {"Wedding": 25000}';
