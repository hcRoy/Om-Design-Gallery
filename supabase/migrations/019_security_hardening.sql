-- Security hardening from AUDIT_REPORT + Supabase Security Advisor (2026-09-04).
-- 1) Revoke client EXECUTE on privileged SECURITY DEFINER RPCs
-- 2) Lock profiles.role against self-escalation
-- 3) Fix protect_wallet_balance search_path
-- 4) Restrict next_admission_form_number to admins
-- 5) Stop product-images listing; tighten design_types public read
-- 6) Add missing FK indexes

-- ---------- Wallet / offer RPCs: service_role only ----------
revoke all on function public.adjust_wallet_balance(uuid, numeric, text, uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.adjust_wallet_balance(uuid, numeric, text, uuid, text, uuid) to service_role;

revoke all on function public.increment_offer_usage(uuid) from public, anon, authenticated;
grant execute on function public.increment_offer_usage(uuid) to service_role;

revoke all on function public.consume_order_offer_usage(uuid) from public, anon, authenticated;
grant execute on function public.consume_order_offer_usage(uuid) to service_role;

-- ---------- Trigger / internal helpers: not callable via PostgREST ----------
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.next_design_id() from public, anon, authenticated;
revoke all on function public.designs_assign_design_id() from public, anon, authenticated;
revoke all on function public.designs_lock_design_id() from public, anon, authenticated;
revoke all on function public.protect_wallet_balance() from public, anon, authenticated;

-- ---------- is_admin: needed by RLS for signed-in users; not for anon ----------
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- ---------- Phone→email lookup: remove public RPC (login uses Edge Function) ----------
revoke all on function public.lookup_email_by_phone(text) from public, anon, authenticated;

-- ---------- Admission form numbers: admins only ----------
create or replace function public.next_admission_form_number()
returns int
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() is distinct from 'service_role' and not public.is_admin() then
    raise exception 'forbidden';
  end if;
  return nextval('admission_form_number_seq')::int;
end;
$$;

revoke all on function public.next_admission_form_number() from public, anon;
grant execute on function public.next_admission_form_number() to authenticated, service_role;

-- ---------- Advisor: mutable search_path on protect_wallet_balance ----------
create or replace function public.protect_wallet_balance()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE'
     and NEW.wallet_balance is distinct from OLD.wallet_balance
     and current_setting('app.allow_wallet_adjust', true) is distinct from 'on'
  then
    NEW.wallet_balance := OLD.wallet_balance;
  end if;
  return NEW;
end;
$$;

-- ---------- Block role self-escalation (and any non-admin role write) ----------
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE' and NEW.role is distinct from OLD.role then
    -- Only an already-admin session may change roles (admin Users tab).
    if not exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    ) then
      NEW.role := OLD.role;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists protect_profile_role_trg on public.profiles;
create trigger protect_profile_role_trg
  before update on public.profiles
  for each row
  execute function public.protect_profile_role();

revoke all on function public.protect_profile_role() from public, anon, authenticated;

-- ---------- Advisor: public bucket listing ----------
drop policy if exists "public read product images" on storage.objects;
-- product-images remains a public bucket; object URLs work without a SELECT policy.

drop policy if exists "admin update admission photos" on storage.objects;
create policy "admin update admission photos" on storage.objects
  for update using (bucket_id = 'admission-photos' and public.is_admin());

drop policy if exists "admin delete admission photos" on storage.objects;
create policy "admin delete admission photos" on storage.objects
  for delete using (bucket_id = 'admission-photos' and public.is_admin());

-- ---------- design_types: hide inactive from public ----------
drop policy if exists "public read design_types" on public.design_types;
create policy "public read design_types" on public.design_types
  for select using (is_active = true);

-- ---------- Missing FK / filter indexes ----------
create index if not exists designs_category_id_idx on public.designs (category_id);
create index if not exists designs_subcategory_id_idx on public.designs (subcategory_id);
create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists wallet_transactions_user_id_idx on public.wallet_transactions (user_id);
