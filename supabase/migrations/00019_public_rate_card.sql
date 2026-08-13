-- Public: latest active rate card for a creator (profile page)
-- Run after 00018_creator_docs.sql

create or replace function public.get_public_rate_card_for_creator(p_user_id uuid)
returns setof public.rate_cards
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.rate_cards
  where creator_user_id = p_user_id
    and status = 'active'
  order by updated_at desc nulls last, created_at desc
  limit 1;
$$;

revoke all on function public.get_public_rate_card_for_creator(uuid) from public;
grant execute on function public.get_public_rate_card_for_creator(uuid) to anon, authenticated;

comment on function public.get_public_rate_card_for_creator(uuid) is
  'Returns one active rate card for public creator profiles.';
