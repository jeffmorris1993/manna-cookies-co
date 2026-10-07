import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { getLiveDropView } from "@/lib/live-drop";
import { formatMoney } from "@/lib/format";
import StatTile from "@/components/dashboard/StatTile";
import OpenCloseCard from "@/components/dashboard/OpenCloseCard";
import DotGrid from "@/components/dashboard/DotGrid";

export default async function DashboardHome() {
  await connection();
  let supabase;
  try {
    ({ supabase } = await requireOwner());
  } catch {
    redirect("/login");
  }

  const drop = await getLiveDropView();

  if (!drop) {
    return (
      <main className="pt-8">
        <h1 className="font-display text-4xl font-medium text-ink">Today&apos;s Manna</h1>
        <p className="mt-6 border border-brown/10 bg-cream-raised px-5 py-6 text-sm text-muted">
          No drop is live right now. Open the Bake tab to make one live.
        </p>
        <Link href="/dashboard/drops" className="eyebrow mt-4 inline-block bg-ink px-6 py-4 text-cream">
          Go to Drops
        </Link>
      </main>
    );
  }

  const { data: orderRows } = await supabase
    .from("orders")
    .select("cookie_count, price_cents, paid, status")
    .eq("drop_id", drop.id)
    .in("status", ["new", "preparing", "ready", "picked"]);
  const orders = orderRows ?? [];

  const cookiesOrdered = orders.reduce((s, o) => s + o.cookie_count, 0);
  const revenueCents = orders.filter((o) => o.paid).reduce((s, o) => s + o.price_cents, 0);
  const toPrepare = orders.filter((o) => o.status === "new" || o.status === "preparing").length;
  const ready = orders.filter((o) => o.status === "ready").length;
  const picked = orders.filter((o) => o.status === "picked").length;

  const pipeline = [
    { label: "Orders to Prepare", count: toPrepare, href: "/dashboard/orders?filter=prepare" },
    { label: "Orders Ready", count: ready, href: "/dashboard/orders?filter=ready" },
    { label: "Orders Picked Up", count: picked, href: "/dashboard/orders?filter=picked" },
  ];

  return (
    <main className="pt-8">
      <h1 className="font-display text-4xl font-medium text-ink">Today&apos;s Manna</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Cookies Ordered" value={cookiesOrdered} />
        <StatTile label="Revenue" value={Math.round(revenueCents / 100)} prefix="$" />
        <StatTile label="Orders" value={orders.length} />
        <StatTile label="Cookies Remaining" value={drop.remaining} />
      </div>

      <div className="mt-4 bg-ink px-6 py-6 text-cream">
        <div className="flex items-baseline justify-between">
          <span className="eyebrow text-gold">Next Bake</span>
          <span className="eyebrow text-cream-dark-muted" style={{ fontSize: "9px" }}>
            {drop.pickupShort}
          </span>
        </div>
        <p className="mt-3 font-display text-2xl">
          {drop.reserved} <span className="text-cream-dark-muted">/ {drop.capacity}</span>
          <span className="ml-2 text-sm text-cream-dark-muted">cookies reserved</span>
        </p>
        <DotGrid capacity={drop.capacity} reserved={drop.reserved} />
        <p className="mt-3 text-xs text-cream-dark-muted">
          Each dot is one cookie · {drop.remaining} remaining
        </p>
        <p className="mt-4 border-t border-cream/10 pt-3 text-sm text-cream-dark-muted">
          {drop.cookie} · {formatMoney(revenueCents)} collected
        </p>
      </div>

      <OpenCloseCard dropId={drop.id} isOpen={drop.isOpen} deadlineLabel={drop.deadlineLabel} />

      <div className="mt-4 grid grid-cols-3 gap-3">
        {pipeline.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="border border-brown/10 bg-cream-raised px-3 py-5 text-center transition-colors hover:border-brown/40"
          >
            <div className="font-display text-3xl font-medium text-ink">{p.count}</div>
            <div className="eyebrow mt-2 text-muted-2" style={{ fontSize: "8px" }}>
              {p.label}
            </div>
          </Link>
        ))}
      </div>

      <Link
        href="/dashboard/whats-next"
        className="eyebrow mt-6 block text-center text-muted-2 transition-colors hover:text-brown"
        style={{ fontSize: "9px" }}
      >
        What&apos;s next for Manna →
      </Link>
    </main>
  );
}
