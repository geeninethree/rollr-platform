-- Creator invoices (document tool — ROLLR is not merchant of record)
-- Run after 00001–00016.

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null references auth.users(id) on delete cascade,
  inquiry_id uuid references public.inquiries(id) on delete set null,
  invoice_number text not null,
  issue_date date not null default (timezone('utc'::text, now()))::date,
  due_date date,
  -- Bill from (creator)
  seller_name text not null,
  seller_email text,
  seller_phone text,
  seller_gstin text,
  seller_address text,
  -- Bill to (client)
  client_name text not null,
  client_email text,
  client_phone text,
  client_address text,
  -- Line items as JSON: [{ description, quantity, unit_amount }]
  line_items jsonb not null default '[]'::jsonb,
  currency text not null default 'INR',
  subtotal numeric(12,2) not null default 0,
  gst_percent numeric(5,2) not null default 0,
  gst_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  payment_note text,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'paid', 'void')),
  public_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists invoices_creator_idx
  on public.invoices (creator_user_id, created_at desc);
create index if not exists invoices_token_idx
  on public.invoices (public_token);

alter table public.invoices enable row level security;

drop policy if exists "Creators select own invoices" on public.invoices;
create policy "Creators select own invoices"
  on public.invoices for select
  to authenticated
  using (creator_user_id = auth.uid());

drop policy if exists "Creators insert own invoices" on public.invoices;
create policy "Creators insert own invoices"
  on public.invoices for insert
  to authenticated
  with check (creator_user_id = auth.uid());

drop policy if exists "Creators update own invoices" on public.invoices;
create policy "Creators update own invoices"
  on public.invoices for update
  to authenticated
  using (creator_user_id = auth.uid())
  with check (creator_user_id = auth.uid());

drop policy if exists "Creators delete own invoices" on public.invoices;
create policy "Creators delete own invoices"
  on public.invoices for delete
  to authenticated
  using (creator_user_id = auth.uid());

-- Public share: only via token RPC (no table-wide anon select)
create or replace function public.get_invoice_by_token(p_token text)
returns setof public.invoices
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.invoices
  where public_token = trim(p_token)
    and status is distinct from 'void'
  limit 1;
$$;

revoke all on function public.get_invoice_by_token(text) from public;
grant execute on function public.get_invoice_by_token(text) to anon, authenticated;

comment on table public.invoices is
  'Creator-issued invoices. ROLLR is not the seller; tax/compliance is creator responsibility.';
