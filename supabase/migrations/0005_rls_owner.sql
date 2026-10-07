-- M4/L10: pin every policy to the owner's auth.uid() so the database itself
-- enforces single-owner access even if auth settings ever drift, and make
-- table privileges explicit and version-controlled.

-- hello@sirromstudios.com
do $$
declare
  owner_id constant uuid := '3c22d4c7-f29e-4c75-b1af-a7fc08437ce9';
begin
  -- reads
  execute format('alter policy "owner read drops"     on drops            using ((select auth.uid()) = %L::uuid)', owner_id);
  execute format('alter policy "owner read packages"  on drop_packages    using ((select auth.uid()) = %L::uuid)', owner_id);
  execute format('alter policy "owner read windows"   on pickup_windows   using ((select auth.uid()) = %L::uuid)', owner_id);
  execute format('alter policy "owner read customers" on customers        using ((select auth.uid()) = %L::uuid)', owner_id);
  execute format('alter policy "owner read orders"    on orders           using ((select auth.uid()) = %L::uuid)', owner_id);
  execute format('alter policy "owner read waitlist"  on waitlist_entries using ((select auth.uid()) = %L::uuid)', owner_id);

  -- writes
  execute format('alter policy "owner insert drops"    on drops          with check ((select auth.uid()) = %L::uuid)', owner_id);
  execute format('alter policy "owner update drops"    on drops          using ((select auth.uid()) = %L::uuid) with check ((select auth.uid()) = %L::uuid)', owner_id, owner_id);
  execute format('alter policy "owner insert packages" on drop_packages  with check ((select auth.uid()) = %L::uuid)', owner_id);
  execute format('alter policy "owner update packages" on drop_packages  using ((select auth.uid()) = %L::uuid) with check ((select auth.uid()) = %L::uuid)', owner_id, owner_id);
  execute format('alter policy "owner delete packages" on drop_packages  using ((select auth.uid()) = %L::uuid)', owner_id);
  execute format('alter policy "owner insert windows"  on pickup_windows with check ((select auth.uid()) = %L::uuid)', owner_id);
  execute format('alter policy "owner update windows"  on pickup_windows using ((select auth.uid()) = %L::uuid) with check ((select auth.uid()) = %L::uuid)', owner_id, owner_id);
  execute format('alter policy "owner delete windows"  on pickup_windows using ((select auth.uid()) = %L::uuid)', owner_id);
  execute format('alter policy "owner update orders"   on orders         using ((select auth.uid()) = %L::uuid) with check ((select auth.uid()) = %L::uuid)', owner_id, owner_id);
end $$;

-- explicit, version-controlled table privileges
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

revoke all on all tables in schema public from authenticated;
grant select on drops, drop_packages, pickup_windows, customers, orders, waitlist_entries to authenticated;
grant insert, update, delete on drops, drop_packages, pickup_windows to authenticated;
grant update on orders to authenticated;
