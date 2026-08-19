-- Phase 5 (Products CRUD) needs two Storage buckets that don't exist in
-- your original schema — it only defines Postgres tables. Buckets are a
-- Storage-layer concept, so this migration creates them via SQL against
-- `storage.buckets`/`storage.objects` rather than requiring a manual
-- dashboard step, but you're welcome to create them from the Storage UI
-- instead if you'd rather do it by hand.
--
-- `product-images`: public bucket. Anyone can view (matches
--   "public read designs" on the table), only admins can write.
-- `design-files`: PRIVATE bucket, matching the `-- private bucket`
--   comment on `designs.design_file_url` in your schema. Only admins can
--   read/write it here. There's no customer-download policy yet because
--   that depends on a checkout/entitlement flow that doesn't exist
--   yet (see the Buy Now stub from Phase 3) — granting buyers access to
--   purchased files is a follow-up once payment is wired up, likely via
--   short-lived signed URLs rather than a broad read policy.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('design-files', 'design-files', false)
on conflict (id) do nothing;

create policy "public read product images" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "admin write product images" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());

create policy "admin update product images" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());

create policy "admin delete product images" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());

create policy "admin manage design files" on storage.objects
  for all using (bucket_id = 'design-files' and public.is_admin());
