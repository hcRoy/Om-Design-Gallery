-- Email/password auth: profile metadata on signup + phone→email lookup for login.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  profile_phone text := coalesce(new.phone, meta->>'phone');
  profile_name text := coalesce(meta->>'full_name', meta->>'name');
begin
  insert into public.profiles (id, phone, email, full_name)
  values (new.id, profile_phone, new.email, profile_name)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Lets users sign in with mobile when email is the primary auth identity.
-- Returns only the email for a matching profile phone; login still verifies password.
create or replace function public.lookup_email_by_phone(phone_input text)
returns text
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  digits text := regexp_replace(phone_input, '\D', '', 'g');
  normalized text;
begin
  if phone_input is null or trim(phone_input) = '' then
    return null;
  end if;

  if length(digits) = 10 then
    normalized := '+91' || digits;
  elsif length(digits) = 12 and digits like '91%' then
    normalized := '+' || digits;
  else
    normalized := '+' || digits;
  end if;

  return (
    select p.email
    from public.profiles p
    where p.phone = normalized
    limit 1
  );
end;
$$;

revoke all on function public.lookup_email_by_phone(text) from public;
grant execute on function public.lookup_email_by_phone(text) to anon, authenticated;
