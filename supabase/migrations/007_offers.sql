-- Offers apply to the checkout total at payment time — never to the
-- browsable catalog price. Codes are intentionally not publicly
-- selectable: listing every coupon via the anon key would leak the
-- store's full promotion inventory. Validation happens only through the
-- `validate-offer` Edge Function, which answers for one code (or the
-- best automatic offer) without exposing the table.
--
-- `increment_offer_usage` mirrors the wallet row-lock pattern: two
-- concurrent checkouts racing for the last redemption of a limited
-- code must not both succeed.

create table offers (
  id uuid primary key default gen_random_uuid(),
  code text unique, -- null = automatically applied, no code needed
  discount_percentage numeric(5,2) not null
    check (discount_percentage > 0 and discount_percentage <= 100),
  starts_at timestamptz,
  ends_at timestamptz,
  min_order_amount numeric(10,2), -- null = no minimum
  usage_limit int, -- null = unlimited
  times_used int not null default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table offers enable row level security;

-- Deliberately NO public select policy. If every valid code were
-- selectable via the anon key, anyone could list every coupon this
-- store has ever issued.

create policy "admin manage offers" on offers
  for all using (public.is_admin());

-- Track which offer was applied when the order was created, so usage
-- can be incremented only after payment actually succeeds — and only once,
-- even if both verify-razorpay-payment and the webhook mark the order paid.
alter table orders
  add column if not exists offer_id uuid references offers(id) on delete set null;

alter table orders
  add column if not exists offer_usage_counted boolean not null default false;

create or replace function public.increment_offer_usage(p_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usage_limit int;
  v_times_used int;
begin
  -- Row-level lock: two concurrent finalizations cannot both consume
  -- the last remaining redemption of a limited-use offer.
  select usage_limit, times_used
    into v_usage_limit, v_times_used
  from offers
  where id = p_offer_id
  for update;

  if not found then
    raise exception 'Offer not found';
  end if;

  if v_usage_limit is not null and v_times_used >= v_usage_limit then
    raise exception 'Offer usage limit reached';
  end if;

  update offers
  set times_used = times_used + 1
  where id = p_offer_id;
end;
$$;

create or replace function public.consume_order_offer_usage(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer_id uuid;
  v_already_counted boolean;
begin
  -- Lock the order row so verify + webhook cannot both claim the usage.
  select offer_id, offer_usage_counted
    into v_offer_id, v_already_counted
  from orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_offer_id is null or v_already_counted then
    return;
  end if;

  perform public.increment_offer_usage(v_offer_id);

  update orders
  set offer_usage_counted = true
  where id = p_order_id;
end;
$$;
