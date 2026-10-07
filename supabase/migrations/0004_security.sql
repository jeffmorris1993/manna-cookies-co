-- Security hardening from the audit:
--  H1: releases keep an audit trail ('canceled'), confirm raises on 0 rows
--  M8: pending holds expire after 5 minutes; concurrent pending holds capped

create or replace function release_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- keep the row as evidence; capacity frees because 'canceled' is excluded
  -- from every reservation sum
  update public.orders
     set status = 'canceled'
   where id = p_order_id and status = 'pending';
end
$$;

create or replace function confirm_order(
  p_order_id uuid,
  p_square_order_id text,
  p_square_payment_id text,
  p_square_customer_id text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer uuid;
begin
  update public.orders
     set status = 'new',
         paid = true,
         square_order_id = coalesce(square_order_id, p_square_order_id),
         square_payment_id = coalesce(square_payment_id, p_square_payment_id)
   where id = p_order_id
     and status in ('pending', 'new');
  if not found then
    -- money may have been taken: never swallow this
    raise exception 'ORDER_GONE';
  end if;

  select customer_id into v_customer from public.orders where id = p_order_id;
  update public.customers c
     set square_customer_id = coalesce(c.square_customer_id, p_square_customer_id)
   where c.id = v_customer;
end
$$;

create or replace function reserve_order(
  p_idempotency_key uuid,
  p_drop_id uuid,
  p_window_id uuid,
  p_package package_kind,
  p_name text,
  p_phone text,
  p_email text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_drop public.drops%rowtype;
  v_pkg  public.drop_packages%rowtype;
  v_win  public.pickup_windows%rowtype;
  v_customer_id uuid;
  v_order public.orders%rowtype;
  v_count int;
  v_sold int;
  v_pending int;
begin
  -- idempotent replay: return the existing order untouched
  select * into v_order from public.orders where idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object(
      'order_id', v_order.id,
      'order_number', v_order.order_number,
      'price_cents', v_order.price_cents,
      'cookie_count', v_order.cookie_count,
      'customer_id', v_order.customer_id,
      'status', v_order.status,
      'square_payment_id', v_order.square_payment_id,
      'replayed', true
    );
  end if;

  -- expire abandoned checkouts quickly (M8: 5 minutes)
  update public.orders
     set status = 'canceled'
   where drop_id = p_drop_id and status = 'pending'
     and created_at < now() - interval '5 minutes';

  -- serialize all reservations for this drop
  select * into v_drop from public.drops
   where id = p_drop_id and status = 'live'
   for update;
  if not found then
    raise exception 'NOT_LIVE';
  end if;
  if not v_drop.is_open or now() > v_drop.deadline then
    raise exception 'CLOSED';
  end if;

  -- M8: cap concurrent unpaid holds so capacity can't be parked for free
  select count(*) into v_pending
    from public.orders
   where drop_id = p_drop_id and status = 'pending';
  if v_pending >= 12 then
    raise exception 'BUSY';
  end if;

  select * into v_pkg from public.drop_packages
   where drop_id = p_drop_id and kind = p_package and enabled;
  if not found then
    raise exception 'PACKAGE_UNAVAILABLE';
  end if;

  select * into v_win from public.pickup_windows
   where id = p_window_id and drop_id = p_drop_id;
  if not found then
    raise exception 'WINDOW_INVALID';
  end if;
  if v_win.is_full then
    raise exception 'WINDOW_FULL';
  end if;

  v_count := case p_package when 'three' then 3 when 'half' then 6 else 12 end;

  select coalesce(sum(cookie_count), 0) into v_sold
    from public.orders
   where drop_id = p_drop_id
     and status in ('pending','new','preparing','ready','picked');
  if v_sold + v_count > v_drop.capacity then
    raise exception 'SOLD_OUT';
  end if;

  insert into public.customers (phone, name, email)
  values (p_phone, p_name, nullif(p_email, ''))
  on conflict (phone) do update
    set name = excluded.name,
        email = coalesce(excluded.email, public.customers.email)
  returning id into v_customer_id;

  insert into public.orders
    (drop_id, customer_id, window_id, package, cookie_count, price_cents,
     status, idempotency_key)
  values
    (p_drop_id, v_customer_id, p_window_id, p_package, v_count, v_pkg.price_cents,
     'pending', p_idempotency_key)
  returning * into v_order;

  return jsonb_build_object(
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'price_cents', v_order.price_cents,
    'cookie_count', v_order.cookie_count,
    'customer_id', v_customer_id,
    'status', v_order.status,
    'square_payment_id', null,
    'replayed', false
  );
end
$$;
