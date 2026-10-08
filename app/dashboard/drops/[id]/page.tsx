import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import DropEditor from "@/components/dashboard/DropEditor";
import type { PackageKind } from "@/lib/types";

export default async function DropEditPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  let supabase;
  try {
    ({ supabase } = await requireOwner());
  } catch {
    redirect("/login");
  }
  const { id } = await params;

  const { data: drop } = await supabase
    .from("drops")
    .select("id, cookie, description, photo_url, pickup_date, deadline_days, capacity, status, is_open")
    .eq("id", id)
    .maybeSingle();
  if (!drop) notFound();

  const [{ data: pkgs }, { data: wins }, { data: orderRows }] = await Promise.all([
    supabase.from("drop_packages").select("kind, enabled, price_cents").eq("drop_id", id),
    supabase
      .from("pickup_windows")
      .select("id, starts, ends, is_full, sort, pickup_date")
      .eq("drop_id", id)
      .order("pickup_date")
      .order("starts"),
    supabase
      .from("orders")
      .select("cookie_count, price_cents, paid, status")
      .eq("drop_id", id)
      .in("status", ["new", "preparing", "ready", "picked"]),
  ]);

  const reserved = (orderRows ?? []).reduce((s, o) => s + o.cookie_count, 0);
  const revenue = (orderRows ?? []).filter((o) => o.paid).reduce((s, o) => s + o.price_cents, 0);

  const kindOrder: PackageKind[] = ["three", "half", "dozen"];

  return (
    <DropEditor
      drop={{
        id: drop.id,
        cookie: drop.cookie,
        description: drop.description,
        deadlineDays: drop.deadline_days,
        capacity: drop.capacity,
        status: drop.status,
        photoUrl: drop.photo_url,
        isOpen: drop.is_open,
        reserved,
        revenue,
      }}
      packages={(pkgs ?? [])
        .sort((a, b) => kindOrder.indexOf(a.kind) - kindOrder.indexOf(b.kind))
        .map((p) => ({ kind: p.kind, enabled: p.enabled, priceCents: p.price_cents }))}
      windows={(wins ?? []).map((w) => ({
        id: w.id,
        date: w.pickup_date,
        starts: w.starts.slice(0, 5),
        ends: w.ends.slice(0, 5),
        full: w.is_full,
      }))}
    />
  );
}
