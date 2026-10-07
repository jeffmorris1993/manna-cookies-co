-- Initial drops: this week's live bake + next week scheduled.
with live as (
  insert into drops (cookie, description, pickup_date, deadline, capacity, status, is_open)
  values (
    'Brown Butter Chocolate Chunk',
    'Brown Butter • Premium Chocolate • Flaky Sea Salt',
    '2026-10-10',
    '2026-10-08 20:00:00-04',
    60,
    'live',
    true
  )
  returning id
),
nextdrop as (
  insert into drops (cookie, description, pickup_date, deadline, capacity, status, is_open)
  values (
    'Toasted Pecan Brown Butter',
    'Brown Butter • Toasted Pecans • Demerara Sugar',
    '2026-10-17',
    '2026-10-15 20:00:00-04',
    96,
    'scheduled',
    true
  )
  returning id
),
pkgs as (
  insert into drop_packages (drop_id, kind, enabled, price_cents)
  select id, k.kind, true, k.price
  from (select id from live union all select id from nextdrop) d,
       (values ('three'::package_kind, 1400), ('half'::package_kind, 2800), ('dozen'::package_kind, 5200)) as k(kind, price)
  returning drop_id
)
insert into pickup_windows (drop_id, starts, ends, is_full, sort)
select d.id, w.starts::time, w.ends::time, false, w.sort
from (select id from live union all select id from nextdrop) d,
     (values ('09:00','11:00',0), ('11:00','13:00',1), ('13:00','15:00',2), ('15:00','17:00',3)) as w(starts, ends, sort);
