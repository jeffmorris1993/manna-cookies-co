-- Second admin (Elaina, j.komolmis7@gmail.com). Every owner-pinned policy
-- now accepts either owner UID.
do $$
declare
  owners constant uuid[] := array[
    '3c22d4c7-f29e-4c75-b1af-a7fc08437ce9', -- Jeff   · hello@sirromstudios.com
    'ff88b788-355f-41d2-8f7c-5dcaa4b78a4b'  -- Elaina · j.komolmis7@gmail.com
  ];
  u constant text := format('(select auth.uid()) = any (array[%L::uuid, %L::uuid])', owners[1], owners[2]);
begin
  execute format('alter policy "owner read drops"     on drops            using (%s)', u);
  execute format('alter policy "owner read packages"  on drop_packages    using (%s)', u);
  execute format('alter policy "owner read windows"   on pickup_windows   using (%s)', u);
  execute format('alter policy "owner read customers" on customers        using (%s)', u);
  execute format('alter policy "owner read orders"    on orders           using (%s)', u);
  execute format('alter policy "owner read waitlist"  on waitlist_entries using (%s)', u);
  execute format('alter policy "owner read settings"  on app_settings     using (%s)', u);

  execute format('alter policy "owner insert drops"    on drops          with check (%s)', u);
  execute format('alter policy "owner update drops"    on drops          using (%s) with check (%s)', u, u);
  execute format('alter policy "owner insert packages" on drop_packages  with check (%s)', u);
  execute format('alter policy "owner update packages" on drop_packages  using (%s) with check (%s)', u, u);
  execute format('alter policy "owner delete packages" on drop_packages  using (%s)', u);
  execute format('alter policy "owner insert windows"  on pickup_windows with check (%s)', u);
  execute format('alter policy "owner update windows"  on pickup_windows using (%s) with check (%s)', u, u);
  execute format('alter policy "owner delete windows"  on pickup_windows using (%s)', u);
  execute format('alter policy "owner update orders"   on orders         using (%s) with check (%s)', u, u);
  execute format('alter policy "owner insert settings" on app_settings   with check (%s)', u);
  execute format('alter policy "owner update settings" on app_settings   using (%s) with check (%s)', u, u);
end $$;
