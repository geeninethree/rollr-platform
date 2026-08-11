-- Replace SECURITY DEFINER view open_jobs_board with an explicit RPC.
-- Supabase advisor flags views with security_invoker=false; intentional
-- elevated access should be a security definer *function* with tight grants
-- and no contact columns.

drop view if exists public.open_jobs_board;

create or replace function public.list_open_jobs_board()
returns table (
  id uuid,
  poster_id uuid,
  title text,
  description text,
  brief_type text,
  location text,
  category text,
  event_date text,
  budget text,
  poster_name text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  closed_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    j.id,
    j.poster_id,
    j.title,
    j.description,
    j.brief_type,
    j.location,
    j.category,
    j.event_date,
    j.budget,
    j.poster_name,
    j.status,
    j.created_at,
    j.updated_at,
    j.closed_at
  from public.jobs j
  where j.status = 'open'
  order by j.created_at desc;
$$;

comment on function public.list_open_jobs_board() is
  'Public job board rows without poster_whatsapp/email. Security definer by design; contact only via job_poster_contact_after_accept.';

revoke all on function public.list_open_jobs_board() from public;
grant execute on function public.list_open_jobs_board() to anon, authenticated;
