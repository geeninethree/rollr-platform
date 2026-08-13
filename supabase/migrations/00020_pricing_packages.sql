-- Flexible listing packages (custom names + notes). Run after 00004+.
-- category_prices stays as derived floors for directory "From ₹…".

alter table public.creator_profiles
  add column if not exists pricing_packages jsonb default '[]'::jsonb;

alter table public.creator_profiles
  add column if not exists pricing_notes text;

comment on column public.creator_profiles.pricing_packages is
  'Array of {id,name,description,price,unit,category?} packages shown on profile.';
comment on column public.creator_profiles.pricing_notes is
  'Free-text pricing notes (deposit, travel, etc.).';
