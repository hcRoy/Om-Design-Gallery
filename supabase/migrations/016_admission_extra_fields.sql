-- Father mobile, batch type, and package on admissions.

alter table public.admissions
  add column if not exists father_mobile text,
  add column if not exists batch_type text
    check (batch_type is null or batch_type in ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
  add column if not exists package text;
