-- Wallet balance lives on profiles; every mutation must go through the
-- security-definer `adjust_wallet_balance` helper (called only from
-- service-role Edge Functions). There are deliberately no insert /
-- update / delete policies on wallet_transactions for the authenticated
-- role — a compromised client must not be able to credit itself.
--
-- `payment_method` on orders distinguishes Razorpay vs wallet checkouts
-- so Account order history can show how a purchase was paid.

alter table profiles
  add column if not exists wallet_balance numeric(10,2) not null default 0;

create table if not exists wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  amount numeric(10,2) not null, -- positive = credit, negative = debit
  type text not null check (type in ('admin_credit', 'purchase_debit', 'refund')),
  reference_order_id uuid references orders(id),
  note text,
  created_by uuid references profiles(id), -- admin who credited; null for system-generated debits
  created_at timestamptz default now()
);

alter table wallet_transactions enable row level security;

create policy "own wallet transactions" on wallet_transactions
  for select using (auth.uid() = user_id);

create policy "admin read all wallet transactions" on wallet_transactions
  for select using (public.is_admin());

-- Deliberately NO insert/update/delete policies for the authenticated
-- role. Balance changes go through adjust_wallet_balance only.

alter table orders
  add column if not exists payment_method text
    check (payment_method is null or payment_method in ('razorpay', 'wallet'));

-- Existing Razorpay rows predate this column — treat them as razorpay.
update orders
set payment_method = 'razorpay'
where payment_method is null
  and razorpay_order_id is not null;

-- Prevent clients from writing wallet_balance via the normal
-- "update own profile" path. Only adjust_wallet_balance (which sets a
-- transaction-local GUC) may change the balance.
create or replace function public.protect_wallet_balance()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'UPDATE'
     and NEW.wallet_balance is distinct from OLD.wallet_balance
     and current_setting('app.allow_wallet_adjust', true) is distinct from 'on'
  then
    NEW.wallet_balance := OLD.wallet_balance;
  end if;
  return NEW;
end;
$$;

drop trigger if exists protect_wallet_balance_trg on profiles;
create trigger protect_wallet_balance_trg
  before update on profiles
  for each row
  execute function public.protect_wallet_balance();

create or replace function public.adjust_wallet_balance(
  p_user_id uuid,
  p_amount numeric,
  p_type text,
  p_reference_order_id uuid default null,
  p_note text default null,
  p_created_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx_id uuid;
begin
  -- Row-level lock prevents a race between two concurrent debits
  -- (e.g. two browser tabs both trying to spend the same wallet
  -- balance at once) from both succeeding.
  perform 1 from profiles where id = p_user_id for update;

  if not found then
    raise exception 'User not found';
  end if;

  if (select wallet_balance from profiles where id = p_user_id) + p_amount < 0 then
    raise exception 'Insufficient wallet balance';
  end if;

  perform set_config('app.allow_wallet_adjust', 'on', true);

  update profiles
  set wallet_balance = wallet_balance + p_amount,
      updated_at = now()
  where id = p_user_id;

  insert into wallet_transactions (user_id, amount, type, reference_order_id, note, created_by)
  values (p_user_id, p_amount, p_type, p_reference_order_id, p_note, p_created_by)
  returning id into v_tx_id;

  return v_tx_id;
end;
$$;
