-- Up to two Aadhaar card images per admission.

alter table public.admissions
  add column if not exists aadhaar_card_urls text[] not null default '{}';
