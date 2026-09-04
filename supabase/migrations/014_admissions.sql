-- Online class admission applications + office fee ledger.

create sequence if not exists admission_form_number_seq start with 1;

create table if not exists public.admissions (
  id uuid primary key default gen_random_uuid(),
  form_number int unique,
  student_name text not null,
  student_mobile text not null,
  student_photo_url text,
  aadhaar_card_urls text[] not null default '{}',
  student_signature_url text,
  current_address text,
  permanent_address text,
  reference_details text,
  class_start_time text,
  class_end_time text,
  preferred_language text not null default 'gu'
    check (preferred_language in ('en', 'gu')),
  agreed_to_terms boolean not null default false,
  agreed_at timestamptz,
  status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'enrolled', 'rejected')),
  submitted_at timestamptz default now(),
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.admission_fee_installments (
  id uuid primary key default gen_random_uuid(),
  admission_id uuid references public.admissions(id) on delete cascade not null,
  sort_order int not null default 0,
  installment_date date,
  amount numeric(10,2),
  received_by text,
  created_at timestamptz default now()
);

create index if not exists admissions_status_idx on public.admissions (status);
create index if not exists admissions_submitted_at_idx on public.admissions (submitted_at desc);
create index if not exists admission_fee_installments_admission_id_idx
  on public.admission_fee_installments (admission_id, sort_order);

alter table public.admissions enable row level security;
alter table public.admission_fee_installments enable row level security;

drop policy if exists "admin manage admissions" on public.admissions;
create policy "admin manage admissions" on public.admissions
  for all using (public.is_admin());

drop policy if exists "admin manage fee installments" on public.admission_fee_installments;
create policy "admin manage fee installments" on public.admission_fee_installments
  for all using (public.is_admin());

-- Atomic form numbers for concurrent submissions.
create or replace function public.next_admission_form_number()
returns int
language sql
security definer
set search_path = public
as $$
  select nextval('admission_form_number_seq')::int;
$$;

-- Private bucket for applicant photos + signature images (service role writes).
insert into storage.buckets (id, name, public)
values ('admission-photos', 'admission-photos', false)
on conflict (id) do nothing;

drop policy if exists "admin read admission photos" on storage.objects;
create policy "admin read admission photos" on storage.objects
  for select using (bucket_id = 'admission-photos' and public.is_admin());
