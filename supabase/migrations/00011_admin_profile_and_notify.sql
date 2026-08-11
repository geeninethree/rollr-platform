-- Admin can update any profile (recruiter multi-job activation, role fixes)
-- + optional helper for waitlist ops
-- Run after 00008–00010.

-- Admins update other users' profiles (e.g. recruiter_sub_status = active)
drop policy if exists "Admins update any profile" on public.profiles;
create policy "Admins update any profile"
  on public.profiles for update
  to authenticated
  using (public.is_rollr_admin())
  with check (public.is_rollr_admin());

-- Admins can read any profile (ops / email match for activation)
drop policy if exists "Admins read any profile" on public.profiles;
create policy "Admins read any profile"
  on public.profiles for select
  to authenticated
  using (public.is_rollr_admin());

comment on policy "Admins update any profile" on public.profiles is
  'Required for admin approve recruiter waitlist → set recruiter_sub_status active';
