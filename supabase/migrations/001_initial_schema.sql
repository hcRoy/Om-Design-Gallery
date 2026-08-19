-- Your original schema, unchanged, saved here so supabase/migrations/
-- is a complete, ordered set (001 → 004) rather than assuming this part
-- was already applied by hand. If you've already run this against your
-- project, skip straight to 002.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text unique,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  image_url text,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table designs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  price numeric(10,2) not null,
  category_id uuid references categories(id) on delete set null,
  thumbnail_url text,
  gallery_urls text[],
  design_file_url text,          -- private bucket
  file_format text,               -- DST, PES, EXP, JEF
  stitch_count int,
  size_mm text,
  tags text[],
  is_featured boolean default false,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table wishlists (
  user_id uuid references profiles(id) on delete cascade,
  design_id uuid references designs(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, design_id)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  design_id uuid references designs(id),
  amount numeric(10,2),
  status text default 'pending' check (status in ('pending','paid','failed')),
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table designs enable row level security;
alter table categories enable row level security;
alter table wishlists enable row level security;
alter table orders enable row level security;

create policy "own profile" on profiles for select using (auth.uid() = id);
create policy "update own profile" on profiles for update using (auth.uid() = id);

create policy "public read designs" on designs for select using (is_active = true);
create policy "admin write designs" on designs for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "public read categories" on categories for select using (true);
create policy "admin write categories" on categories for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "own wishlist" on wishlists for all using (auth.uid() = user_id);
