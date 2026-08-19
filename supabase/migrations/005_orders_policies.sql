-- Your original schema runs `alter table orders enable row level
-- security;` but never adds a policy for it (unlike every other table).
-- With RLS on and zero policies, Postgres denies all access by
-- default — including to admins — so the Dashboard's order count
-- (added in Phase 5) would silently return 0 forever, and a future
-- checkout flow wouldn't be able to read a customer's own orders either.
--
-- This adds the two policies that were presumably just missed: a
-- customer can see their own orders, and an admin can see (and, since
-- order status needs to be updated on payment webhooks eventually,
-- manage) all of them.

create policy "own orders" on orders
  for select using (auth.uid() = user_id);

create policy "admin manage orders" on orders
  for all using (public.is_admin());
