-- Phase 2: auto-create a `profiles` row when a new auth.users row appears
-- (i.e. right after phone/OTP sign-up), instead of inserting from the
-- client. This is deliberate:
--
--   Your original `profiles` RLS policies only cover select/update for
--   the owner — there's no insert policy. A client-side "create my
--   profile row on first login" call would be rejected by RLS as
--   written. Two ways to fix that:
--     (a) add `create policy "insert own profile" on profiles for insert
--         with check (auth.uid() = id);` and insert from the client, or
--     (b) create the row server-side via a trigger on auth.users, using
--         security definer so it runs with elevated privileges and
--         bypasses RLS for this one, narrow write.
--
--   Went with (b). It's the safer default: the row is guaranteed to
--   exist the moment the user exists (no race with the client), and it
--   doesn't require opening an insert path on `profiles` at all, which
--   keeps the table's writable surface smaller. Ship (a) instead only if
--   you specifically want the client to control what goes in the row at
--   creation time (e.g. capturing a referral code from the signup form).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone, email, full_name)
  values (new.id, new.phone, new.email, null)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
