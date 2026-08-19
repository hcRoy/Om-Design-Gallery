-- Adds a stable Razorpay order id reference to the `orders` table.
-- This enables server-side verification and webhook reconciliation.

alter table orders
  add column if not exists razorpay_order_id text;

-- Keep it unique for rows that have it set (supports existing rows with NULL).
create unique index if not exists orders_razorpay_order_id_uq
  on orders (razorpay_order_id)
  where razorpay_order_id is not null;

