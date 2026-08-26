-- Global design types (e.g. Border, Motif, Jaal) assigned to products.
-- designs.design_type_id is nullable so existing rows stay valid.
-- Deleting a type clears the FK (set null) rather than blocking delete.

create table if not exists public.design_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  constraint design_types_name_unique unique (name)
);

alter table public.design_types enable row level security;

drop policy if exists "public read design_types" on public.design_types;
create policy "public read design_types" on public.design_types
  for select using (true);

drop policy if exists "admin write design_types" on public.design_types;
create policy "admin write design_types" on public.design_types
  for all using (public.is_admin());

alter table public.designs
  add column if not exists design_type_id uuid references public.design_types(id) on delete set null;

create index if not exists designs_design_type_id_idx
  on public.designs (design_type_id);
