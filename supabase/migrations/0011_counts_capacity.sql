-- Orders arranged outside the app: keep the records (orders list, revenue,
-- history) but let them not consume drop capacity. New orders count as usual.
alter table orders add column if not exists counts_capacity boolean not null default true;

-- Existing orders were a deal handled outside the app — free their capacity.
update orders set counts_capacity = false;

-- reserve_order: capacity math only counts capacity-consuming orders.
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

  -- free capacity held by abandoned checkouts
  delete from public.orders
   where drop_id = p_drop_id and status = 'pending'
     and created_at < now() - interval '15 minutes';

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
     and status in ('pending','new','preparing','ready','picked')
     and counts_capacity;
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
