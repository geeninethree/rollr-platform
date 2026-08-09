-- Extra fields for creator studio / live listings (run after 00001 + 00002)

alter table public.creator_profiles
  add column if not exists tagline text,
  add column if not exists service_modes text[] default array['shoot']::text[],
  add column if not exists edit_starting_price numeric default 0,
  add column if not exists portfolio_url text,
  add column if not exists instagram_url text,
  add column if not exists showreel_url text,
  add column if not exists cover_url text,
  add column if not exists listing_status text default 'draft',
  add column if not exists works jsonb default '[]'::jsonb;

comment on column public.creator_profiles.works is 'JSON array of portfolio items (url, role, featured, etc.)';
comment on column public.creator_profiles.listing_status is 'draft | pending_review | published | rejected';

-- Allow creators to delete their own listing row (reset)
create policy "Creator profiles: delete own"
  on public.creator_profiles for delete
  using (auth.uid() = profile_id);
