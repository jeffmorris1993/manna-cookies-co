-- Row Level Security: no anon access at all; authenticated (= the single owner)
-- can read everything and write what the dashboard needs. Public traffic goes
-- through server-side routes using the service role, which bypasses RLS.

alter table drops            enable row level security;
alter table drop_packages    enable row level security;
alter table pickup_windows   enable row level security;
alter table customers        enable row level security;
alter table orders           enable row level security;
alter table waitlist_entries enable row level security;
alter table rate_limits      enable row level security;

-- Reads for the authenticated owner (dashboard server components)
create policy "owner read drops"     on drops            for select to authenticated using (true);
create policy "owner read packages"  on drop_packages    for select to authenticated using (true);
create policy "owner read windows"   on pickup_windows   for select to authenticated using (true);
create policy "owner read customers" on customers        for select to authenticated using (true);
create policy "owner read orders"    on orders           for select to authenticated using (true);
create policy "owner read waitlist"  on waitlist_entries for select to authenticated using (true);

-- Writes for the authenticated owner (dashboard server actions)
create policy "owner insert drops"    on drops          for insert to authenticated with check (true);
create policy "owner update drops"    on drops          for update to authenticated using (true) with check (true);
create policy "owner insert packages" on drop_packages  for insert to authenticated with check (true);
create policy "owner update packages" on drop_packages  for update to authenticated using (true) with check (true);
create policy "owner delete packages" on drop_packages  for delete to authenticated using (true);
create policy "owner insert windows"  on pickup_windows for insert to authenticated with check (true);
create policy "owner update windows"  on pickup_windows for update to authenticated using (true) with check (true);
create policy "owner delete windows"  on pickup_windows for delete to authenticated using (true);
-- order status transitions only; orders are created by the checkout RPC
create policy "owner update orders"   on orders         for update to authenticated using (true) with check (true);

-- rate_limits: service role only — no policies at all.
