-- Subcategories nest under categories so the storefront can browse
-- Category → Subcategory → Designs. designs.category_id stays for
-- legacy / uncategorized rows and is kept in sync from the chosen
-- subcategory in the admin form going forward. subcategory_id is
-- nullable on purpose — existing designs may not have one yet.

create table subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete cascade not null,
  name text not null,
  slug text not null,
  description text,
  image_url text,
  sort_order int default 0,
  created_at timestamptz default now(),
  unique (category_id, slug)
);

alter table subcategories enable row level security;

create policy "public read subcategories" on subcategories
  for select using (true);

create policy "admin write subcategories" on subcategories
  for all using (public.is_admin());

alter table designs
  add column if not exists subcategory_id uuid references subcategories(id) on delete set null;
