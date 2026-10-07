-- Manna Cookies & Co. — core schema
create type drop_status as enum ('scheduled','live','complete');
create type order_status as enum ('pending','new','preparing','ready','picked','canceled');
create type package_kind as enum ('three','half','dozen');

create table drops (
  id          uuid primary key default gen_random_uuid(),
  cookie      text not null,
  description text not null default '',
  pickup_date date not null,
  deadline    timestamptz not null,
  capacity    int  not null check (capacity between 12 and 480 and capacity % 6 = 0),
  status      drop_status not null default 'scheduled',
  is_open     boolean not null default true,
  created_at  timestamptz not null default now()
);

-- at most one live drop, guaranteed by the database
create unique index one_live_drop on drops ((true)) where status = 'live';

create table drop_packages (
  drop_id     uuid not null references drops(id) on delete cascade,
  kind        package_kind not null,
  enabled     boolean not null default true,
  price_cents int not null check (price_cents > 0),
  primary key (drop_id, kind)
);

create table pickup_windows (
  id       uuid primary key default gen_random_uuid(),
  drop_id  uuid not null references drops(id) on delete cascade,
  starts   time not null,
  ends     time not null,
  is_full  boolean not null default false,
  sort     int not null default 0,
  check (ends > starts)
);
create index pickup_windows_drop on pickup_windows(drop_id);

create table customers (
  id                 uuid primary key default gen_random_uuid(),
  phone              text not null unique,
  name               text not null,
  email              text,
  square_customer_id text unique,
  created_at         timestamptz not null default now()
);

create sequence order_number_seq start 1049;

create table orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      int not null unique default nextval('order_number_seq'),
  drop_id           uuid not null references drops(id),
  customer_id       uuid not null references customers(id),
  window_id         uuid not null references pickup_windows(id),
  package           package_kind not null,
  cookie_count      int not null check (cookie_count > 0),
  price_cents       int not null check (price_cents > 0),
  status            order_status not null default 'pending',
  paid              boolean not null default false,
  idempotency_key   uuid not null unique,
  square_order_id   text,
  square_payment_id text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index orders_drop_status on orders(drop_id, status);
create index orders_customer on orders(customer_id);
create index orders_window on orders(window_id);

create table waitlist_entries (
  id         uuid primary key default gen_random_uuid(),
  drop_id    uuid references drops(id) on delete set null,
  contact    text not null,
  created_at timestamptz not null default now(),
  unique (drop_id, contact)
);

create table rate_limits (
  bucket       text not null,
  window_start timestamptz not null,
  hits         int not null default 1,
  primary key (bucket, window_start)
);

create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

create trigger orders_updated_at
  before update on orders
  for each row execute function set_updated_at();
