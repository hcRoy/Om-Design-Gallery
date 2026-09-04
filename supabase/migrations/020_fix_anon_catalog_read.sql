-- Fix anonymous storefront reads broken by 019's is_admin() revoke.
--
-- Root cause: admin policies use FOR ALL … USING (public.is_admin()).
-- FOR ALL includes SELECT, so Postgres evaluates is_admin() for every
-- SELECT — including anon catalog queries. Policies are OR'd, but if
-- EXECUTE on is_admin() is revoked from anon, the query errors instead
-- of treating that policy as false. Result: guests cannot load designs,
-- categories, subcategories, carousel, design_types, etc.
--
-- Security: granting EXECUTE is safe. is_admin() is SECURITY DEFINER and
-- only returns EXISTS(admin profile for auth.uid()). For anon, auth.uid()
-- is null → always false. It does not grant admin rights; it is only a
-- boolean used inside RLS. This matches the standard Supabase pattern.
--
-- Also restore product-images public SELECT so thumbnails remain readable
-- via Storage (bucket stays public; SELECT is for object access / CDN).

grant execute on function public.is_admin() to anon, authenticated, service_role;

drop policy if exists "public read product images" on storage.objects;
create policy "public read product images" on storage.objects
  for select using (bucket_id = 'product-images');
