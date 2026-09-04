-- Staff role: customer shop access + create/view admissions (no edit/delete).
-- Admin retains full admissions manage including update/delete.

-- ---------- profiles.role: allow staff ----------
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('customer', 'admin', 'staff'));

-- ---------- Helpers ----------
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'staff'
  );
$$;

create or replace function public.can_access_admissions()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_admin() or public.is_staff();
$$;

create or replace function public.can_create_admissions()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_admin() or public.is_staff();
$$;

revoke all on function public.is_staff() from public, anon;
revoke all on function public.can_access_admissions() from public, anon;
revoke all on function public.can_create_admissions() from public, anon;

grant execute on function public.is_staff() to authenticated, service_role;
grant execute on function public.can_access_admissions() to authenticated, service_role;
grant execute on function public.can_create_admissions() to authenticated, service_role;

-- Also grant to anon so policy evaluation never fails with permission denied
-- (same pattern as 020 for is_admin).
grant execute on function public.is_staff() to anon;
grant execute on function public.can_access_admissions() to anon;
grant execute on function public.can_create_admissions() to anon;

-- ---------- Form numbers: creators (admin + staff) ----------
create or replace function public.next_admission_form_number()
returns int
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() is distinct from 'service_role'
     and not public.can_create_admissions() then
    raise exception 'forbidden';
  end if;
  return nextval('admission_form_number_seq')::int;
end;
$$;

revoke all on function public.next_admission_form_number() from public, anon;
grant execute on function public.next_admission_form_number() to authenticated, service_role;

-- ---------- Admissions RLS: split ALL into SELECT/INSERT/UPDATE/DELETE ----------
drop policy if exists "admin manage admissions" on public.admissions;

drop policy if exists "admissions select for office" on public.admissions;
create policy "admissions select for office" on public.admissions
  for select using (public.can_access_admissions());

drop policy if exists "admissions insert for office" on public.admissions;
create policy "admissions insert for office" on public.admissions
  for insert with check (public.can_create_admissions());

drop policy if exists "admissions update admin only" on public.admissions;
create policy "admissions update admin only" on public.admissions
  for update using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admissions delete admin only" on public.admissions;
create policy "admissions delete admin only" on public.admissions
  for delete using (public.is_admin());

-- ---------- Fee installments: staff read-only; admin write ----------
drop policy if exists "admin manage fee installments" on public.admission_fee_installments;

drop policy if exists "fee installments select for office" on public.admission_fee_installments;
create policy "fee installments select for office" on public.admission_fee_installments
  for select using (public.can_access_admissions());

drop policy if exists "fee installments insert admin only" on public.admission_fee_installments;
create policy "fee installments insert admin only" on public.admission_fee_installments
  for insert with check (public.is_admin());

drop policy if exists "fee installments update admin only" on public.admission_fee_installments;
create policy "fee installments update admin only" on public.admission_fee_installments
  for update using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "fee installments delete admin only" on public.admission_fee_installments;
create policy "fee installments delete admin only" on public.admission_fee_installments
  for delete using (public.is_admin());

-- ---------- Storage: admission-photos ----------
drop policy if exists "admin read admission photos" on storage.objects;
drop policy if exists "admin upload admission photos" on storage.objects;
drop policy if exists "admin update admission photos" on storage.objects;
drop policy if exists "admin delete admission photos" on storage.objects;

create policy "admission photos select for office" on storage.objects
  for select using (
    bucket_id = 'admission-photos' and public.can_access_admissions()
  );

create policy "admission photos insert for office" on storage.objects
  for insert with check (
    bucket_id = 'admission-photos' and public.can_create_admissions()
  );

-- Update/delete: creators need delete for failed-create rollback; admin for edits.
create policy "admission photos update for office" on storage.objects
  for update using (
    bucket_id = 'admission-photos' and public.can_create_admissions()
  );

create policy "admission photos delete for office" on storage.objects
  for delete using (
    bucket_id = 'admission-photos' and public.can_create_admissions()
  );
