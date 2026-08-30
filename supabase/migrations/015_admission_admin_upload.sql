-- Admin uploads for admission photos/signatures (office fills forms in admin panel).

drop policy if exists "admin upload admission photos" on storage.objects;
create policy "admin upload admission photos" on storage.objects
  for insert with check (bucket_id = 'admission-photos' and public.is_admin());

drop policy if exists "admin update admission photos" on storage.objects;
create policy "admin update admission photos" on storage.objects
  for update using (bucket_id = 'admission-photos' and public.is_admin());

grant execute on function public.next_admission_form_number() to authenticated;
