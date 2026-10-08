-- Owner-editable app settings (pickup address, etc.)
create table app_settings (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now()
);

alter table app_settings enable row level security;

do $$
declare
  owner_id constant uuid := '3c22d4c7-f29e-4c75-b1af-a7fc08437ce9';
begin
  execute format(
    'create policy "owner read settings" on app_settings for select to authenticated using ((select auth.uid()) = %L::uuid)',
    owner_id);
  execute format(
    'create policy "owner insert settings" on app_settings for insert to authenticated with check ((select auth.uid()) = %L::uuid)',
    owner_id);
  execute format(
    'create policy "owner update settings" on app_settings for update to authenticated using ((select auth.uid()) = %L::uuid) with check ((select auth.uid()) = %L::uuid)',
    owner_id, owner_id);
end $$;

revoke all on app_settings from anon;
grant select, insert, update on app_settings to authenticated;

insert into app_settings (key, value) values ('pickup_address', '');
