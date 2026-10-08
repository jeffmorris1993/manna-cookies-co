-- Configurable ordering deadline: N days before pickup (default 2),
-- stored per drop; the global default lives in app_settings.
alter table drops add column deadline_days int not null default 2
  check (deadline_days between 0 and 7);

insert into app_settings (key, value) values ('deadline_days', '2')
on conflict (key) do nothing;
