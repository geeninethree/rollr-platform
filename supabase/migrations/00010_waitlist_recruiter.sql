-- Expand waitlist for recruiter / hire interest (after 00007, 00009)

-- Drop old role check and allow recruiter + hire
alter table public.waitlist_signups drop constraint if exists waitlist_signups_role_check;

alter table public.waitlist_signups
  add constraint waitlist_signups_role_check
  check (role in ('shoot', 'edit', 'both', 'recruiter', 'hire'));

comment on column public.waitlist_signups.role is
  'shoot|edit|both = creator tracks; recruiter = multi-job plan interest; hire = client hiring interest';

-- Helper: when admin marks recruiter waitlist approved, they still activate billing in app/SQL
-- Optional index for filtering
create index if not exists waitlist_signups_role_idx
  on public.waitlist_signups (role, status);
