-- Quotes, booking confirmations, rate cards, delivery notes
-- Run after 00017_invoices.sql

-- ── Quotes (estimate before invoice) ──────────────────────────────────────────
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null references auth.users(id) on delete cascade,
  inquiry_id uuid references public.inquiries(id) on delete set null,
  quote_number text not null,
  issue_date date not null default (timezone('utc'::text, now()))::date,
  valid_until date,
  seller_name text not null,
  seller_email text,
  seller_phone text,
  client_name text not null,
  client_email text,
  client_phone text,
  line_items jsonb not null default '[]'::jsonb,
  currency text not null default 'INR',
  subtotal numeric(12,2) not null default 0,
  gst_percent numeric(5,2) not null default 0,
  gst_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'accepted', 'declined', 'void')),
  public_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists quotes_creator_idx
  on public.quotes (creator_user_id, created_at desc);
create index if not exists quotes_token_idx on public.quotes (public_token);

alter table public.quotes enable row level security;

drop policy if exists "Creators select own quotes" on public.quotes;
create policy "Creators select own quotes"
  on public.quotes for select to authenticated
  using (creator_user_id = auth.uid());

drop policy if exists "Creators insert own quotes" on public.quotes;
create policy "Creators insert own quotes"
  on public.quotes for insert to authenticated
  with check (creator_user_id = auth.uid());

drop policy if exists "Creators update own quotes" on public.quotes;
create policy "Creators update own quotes"
  on public.quotes for update to authenticated
  using (creator_user_id = auth.uid())
  with check (creator_user_id = auth.uid());

drop policy if exists "Creators delete own quotes" on public.quotes;
create policy "Creators delete own quotes"
  on public.quotes for delete to authenticated
  using (creator_user_id = auth.uid());

create or replace function public.get_quote_by_token(p_token text)
returns setof public.quotes
language sql stable security definer set search_path = public as $$
  select * from public.quotes
  where public_token = trim(p_token) and status is distinct from 'void'
  limit 1;
$$;
revoke all on function public.get_quote_by_token(text) from public;
grant execute on function public.get_quote_by_token(text) to anon, authenticated;

-- ── Booking confirmations ─────────────────────────────────────────────────────
create table if not exists public.booking_confirmations (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null references auth.users(id) on delete cascade,
  inquiry_id uuid references public.inquiries(id) on delete set null,
  booking_number text not null,
  issue_date date not null default (timezone('utc'::text, now()))::date,
  creator_name text not null,
  creator_email text,
  creator_phone text,
  client_name text not null,
  client_email text,
  client_phone text,
  event_date date,
  event_time text,
  location text,
  package_title text not null,
  package_description text,
  deposit_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  currency text not null default 'INR',
  terms text,
  notes text,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'confirmed', 'cancelled')),
  public_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists booking_creator_idx
  on public.booking_confirmations (creator_user_id, created_at desc);
create index if not exists booking_token_idx
  on public.booking_confirmations (public_token);

alter table public.booking_confirmations enable row level security;

drop policy if exists "Creators select own bookings" on public.booking_confirmations;
create policy "Creators select own bookings"
  on public.booking_confirmations for select to authenticated
  using (creator_user_id = auth.uid());

drop policy if exists "Creators insert own bookings" on public.booking_confirmations;
create policy "Creators insert own bookings"
  on public.booking_confirmations for insert to authenticated
  with check (creator_user_id = auth.uid());

drop policy if exists "Creators update own bookings" on public.booking_confirmations;
create policy "Creators update own bookings"
  on public.booking_confirmations for update to authenticated
  using (creator_user_id = auth.uid())
  with check (creator_user_id = auth.uid());

drop policy if exists "Creators delete own bookings" on public.booking_confirmations;
create policy "Creators delete own bookings"
  on public.booking_confirmations for delete to authenticated
  using (creator_user_id = auth.uid());

create or replace function public.get_booking_by_token(p_token text)
returns setof public.booking_confirmations
language sql stable security definer set search_path = public as $$
  select * from public.booking_confirmations
  where public_token = trim(p_token) and status is distinct from 'cancelled'
  limit 1;
$$;
revoke all on function public.get_booking_by_token(text) from public;
grant execute on function public.get_booking_by_token(text) to anon, authenticated;

-- ── Rate cards ────────────────────────────────────────────────────────────────
create table if not exists public.rate_cards (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Rate card',
  creator_name text not null,
  creator_tagline text,
  creator_email text,
  creator_phone text,
  packages jsonb not null default '[]'::jsonb,
  notes text,
  currency text not null default 'INR',
  status text not null default 'active'
    check (status in ('draft', 'active', 'archived')),
  public_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists rate_cards_creator_idx
  on public.rate_cards (creator_user_id, created_at desc);
create index if not exists rate_cards_token_idx on public.rate_cards (public_token);

alter table public.rate_cards enable row level security;

drop policy if exists "Creators select own rate cards" on public.rate_cards;
create policy "Creators select own rate cards"
  on public.rate_cards for select to authenticated
  using (creator_user_id = auth.uid());

drop policy if exists "Creators insert own rate cards" on public.rate_cards;
create policy "Creators insert own rate cards"
  on public.rate_cards for insert to authenticated
  with check (creator_user_id = auth.uid());

drop policy if exists "Creators update own rate cards" on public.rate_cards;
create policy "Creators update own rate cards"
  on public.rate_cards for update to authenticated
  using (creator_user_id = auth.uid())
  with check (creator_user_id = auth.uid());

drop policy if exists "Creators delete own rate cards" on public.rate_cards;
create policy "Creators delete own rate cards"
  on public.rate_cards for delete to authenticated
  using (creator_user_id = auth.uid());

create or replace function public.get_rate_card_by_token(p_token text)
returns setof public.rate_cards
language sql stable security definer set search_path = public as $$
  select * from public.rate_cards
  where public_token = trim(p_token) and status is distinct from 'archived'
  limit 1;
$$;
revoke all on function public.get_rate_card_by_token(text) from public;
grant execute on function public.get_rate_card_by_token(text) to anon, authenticated;

-- ── Delivery notes ────────────────────────────────────────────────────────────
create table if not exists public.delivery_notes (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null references auth.users(id) on delete cascade,
  inquiry_id uuid references public.inquiries(id) on delete set null,
  note_number text not null,
  issue_date date not null default (timezone('utc'::text, now()))::date,
  creator_name text not null,
  client_name text not null,
  client_email text,
  client_phone text,
  project_title text not null,
  delivery_date date,
  items jsonb not null default '[]'::jsonb,
  access_note text,
  notes text,
  status text not null default 'draft'
    check (status in ('draft', 'sent')),
  public_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists delivery_notes_creator_idx
  on public.delivery_notes (creator_user_id, created_at desc);
create index if not exists delivery_notes_token_idx
  on public.delivery_notes (public_token);

alter table public.delivery_notes enable row level security;

drop policy if exists "Creators select own delivery notes" on public.delivery_notes;
create policy "Creators select own delivery notes"
  on public.delivery_notes for select to authenticated
  using (creator_user_id = auth.uid());

drop policy if exists "Creators insert own delivery notes" on public.delivery_notes;
create policy "Creators insert own delivery notes"
  on public.delivery_notes for insert to authenticated
  with check (creator_user_id = auth.uid());

drop policy if exists "Creators update own delivery notes" on public.delivery_notes;
create policy "Creators update own delivery notes"
  on public.delivery_notes for update to authenticated
  using (creator_user_id = auth.uid())
  with check (creator_user_id = auth.uid());

drop policy if exists "Creators delete own delivery notes" on public.delivery_notes;
create policy "Creators delete own delivery notes"
  on public.delivery_notes for delete to authenticated
  using (creator_user_id = auth.uid());

create or replace function public.get_delivery_note_by_token(p_token text)
returns setof public.delivery_notes
language sql stable security definer set search_path = public as $$
  select * from public.delivery_notes
  where public_token = trim(p_token)
  limit 1;
$$;
revoke all on function public.get_delivery_note_by_token(text) from public;
grant execute on function public.get_delivery_note_by_token(text) to anon, authenticated;

comment on table public.quotes is 'Creator quotes/estimates. ROLLR is not a party.';
comment on table public.booking_confirmations is 'Creator booking confirmations.';
comment on table public.rate_cards is 'Creator public rate cards.';
comment on table public.delivery_notes is 'Creator delivery/handover notes.';
