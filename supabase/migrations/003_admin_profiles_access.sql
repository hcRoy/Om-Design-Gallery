-- Phase 5 (Users tab) needs an admin to list every profile and toggle
-- any user's role. Your original policies only cover
-- `auth.uid() = id` — a user's own row — so as written, an admin
-- querying `profiles` for the Users table gets back exactly one row
-- (their own) and a role-toggle on anyone else's row is silently
-- rejected by RLS. This adds the missing admin-wide access.
--
-- JUDGMENT CALL: a policy on `profiles` that queries `profiles` inside
-- itself is normally a recursion risk (evaluating the policy re-triggers
-- the policy). The standard fix — used here — is a `security definer`
-- helper function: it runs with elevated privileges, so its internal
-- lookup bypasses RLS instead of re-triggering it.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create policy "admin read all profiles" on profiles
  for select using (public.is_admin());

create policy "admin update all profiles" on profiles
  for update using (public.is_admin());
