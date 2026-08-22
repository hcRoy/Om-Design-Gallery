-- Homepage carousel slides are managed in admin and rendered publicly
-- only when is_active = true. Admins read inactive slides too via the
-- admin manage policy (same public-vs-admin split as designs).

create table carousel_slides (
  id uuid primary key default gen_random_uuid(),
  title text,
  subtitle text,
  image_url text not null,
  link_url text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table carousel_slides enable row level security;

create policy "public read active carousel slides" on carousel_slides
  for select using (is_active = true);

create policy "admin manage carousel slides" on carousel_slides
  for all using (public.is_admin());
