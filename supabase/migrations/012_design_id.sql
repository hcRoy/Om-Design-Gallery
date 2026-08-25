-- Public catalog code for each design: exactly 6 numeric digits.
-- Auto-assigned on INSERT when omitted; immutable after create.
--
-- Note: `orders.design_id` / `wishlists.design_id` remain UUID FKs to
-- `designs.id`. This column (`designs.design_id`) is the human-facing
-- catalog number customers and admins search by.

create or replace function public.next_design_id()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
  attempts int := 0;
begin
  loop
    -- 100000–999999 → always 6 digits, no leading-zero ambiguity
    candidate := (100000 + floor(random() * 900000)::int)::text;
    exit when not exists (
      select 1 from public.designs d where d.design_id = candidate
    );
    attempts := attempts + 1;
    if attempts > 100 then
      raise exception 'failed to allocate a unique design_id';
    end if;
  end loop;
  return candidate;
end;
$$;

alter table public.designs
  add column if not exists design_id text;

-- Backfill existing rows before enforcing NOT NULL
do $$
declare
  r record;
begin
  for r in
    select id from public.designs where design_id is null
  loop
    update public.designs
    set design_id = public.next_design_id()
    where id = r.id;
  end loop;
end;
$$;

alter table public.designs
  alter column design_id set not null;

alter table public.designs
  drop constraint if exists designs_design_id_format;

alter table public.designs
  add constraint designs_design_id_format
  check (design_id ~ '^[0-9]{6}$');

alter table public.designs
  drop constraint if exists designs_design_id_key;

alter table public.designs
  drop constraint if exists designs_design_id_unique;

alter table public.designs
  add constraint designs_design_id_unique unique (design_id);

create index if not exists designs_design_id_idx on public.designs (design_id);

create or replace function public.designs_assign_design_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.design_id is null or btrim(new.design_id) = '' then
    new.design_id := public.next_design_id();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_designs_assign_design_id on public.designs;
create trigger trg_designs_assign_design_id
  before insert on public.designs
  for each row
  execute function public.designs_assign_design_id();

create or replace function public.designs_lock_design_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Catalog codes are permanent; ignore any client attempt to change them
  new.design_id := old.design_id;
  return new;
end;
$$;

drop trigger if exists trg_designs_lock_design_id on public.designs;
create trigger trg_designs_lock_design_id
  before update on public.designs
  for each row
  execute function public.designs_lock_design_id();
