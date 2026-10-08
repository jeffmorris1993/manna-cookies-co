import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { getLiveDropView } from "@/lib/live-drop";
import StatTile from "@/components/dashboard/StatTile";
import EmptyState from "@/components/dashboard/EmptyState";
import PickupAddressCard from "@/components/dashboard/PickupAddressCard";
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
      <main style={{ padding: "12px 0", animation: "mannaIn .35s ease" }}>
        <h1 className="font-display" style={{ fontSize: 30, lineHeight: 1.1 }}>
          Today&apos;s Manna
        </h1>
        <div style={{ marginTop: 14 }}>
          <EmptyState
            title="The oven is resting."
            sub="No drop is live on the website right now. Make one live from the Bake tab and ordering opens instantly."
          >
            <Link
              href="/dashboard/drops"
              style={{
                display: "inline-block",
                height: 52,
                lineHeight: "52px",
                padding: "0 26px",
                borderRadius: 14,
                background: "#24150D",
                color: "#F5EFE4",
                fontSize: 12,
                letterSpacing: ".2em",
                fontWeight: 600,
              }}
            >
              GO TO DROPS
            </Link>
          </EmptyState>
        </div>
      </main>
    );
  }

  const [{ data: orderRows }, { data: settingsRow }] = await Promise.all([
    supabase
      .from("orders")
      .select("cookie_count, price_cents, paid, status")
      .eq("drop_id", drop.id)
      .in("status", ["new", "preparing", "ready", "picked"]),
    supabase.from("app_settings").select("value").eq("key", "pickup_address").maybeSingle(),
  ]);
  const orders = orderRows ?? [];
  const pickupAddress = settingsRow?.value ?? "";

  const cookiesOrdered = orders.reduce((s, o) => s + o.cookie_count, 0);
  const revenueCents = orders.filter((o) => o.paid).reduce((s, o) => s + o.price_cents, 0);
  const toPrepare = orders.filter((o) => o.status === "new" || o.status === "preparing").length;
  const ready = orders.filter((o) => o.status === "ready").length;
  const picked = orders.filter((o) => o.status === "picked").length;

  const pipeline = [
    { label: "Orders to Prepare", n: toPrepare, href: "/dashboard/orders?filter=prepare" },
    { label: "Orders Ready", n: ready, href: "/dashboard/orders?filter=ready" },
    { label: "Orders Picked Up", n: picked, href: "/dashboard/orders?filter=picked" },
  ];

  return (
    <main
      style={{ padding: "12px 0", display: "flex", flexDirection: "column", gap: 14, animation: "mannaIn .35s ease" }}
    >
      <h1 className="font-display" style={{ fontSize: 30, lineHeight: 1.1 }}>
        Today&apos;s Manna
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
        <StatTile label="COOKIES ORDERED" value={cookiesOrdered} />
        <StatTile label="REVENUE" value={Math.round(revenueCents / 100)} prefix="$" />
        <StatTile label="ORDERS" value={orders.length} />
        <StatTile label="COOKIES REMAINING" value={drop.remaining} />
      </div>

      <div style={{ background: "#24150D", color: "#F5EFE4", borderRadius: 16, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: ".2em", fontWeight: 500, color: "#C9A57E" }}>
              NEXT BAKE
            </div>
            <div className="font-display" style={{ marginTop: 6, fontSize: 24 }}>
              {drop.pickupDateLabel}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="font-display" style={{ fontSize: 28, lineHeight: 1 }}>
              {drop.reserved} / {drop.capacity}
            </div>
            <div style={{ fontSize: 11, color: "#D9C8B3", marginTop: 4 }}>cookies reserved</div>
          </div>
        </div>
        <DotGrid capacity={drop.capacity} reserved={drop.reserved} />
        <div style={{ marginTop: 12, fontSize: 12, color: "#D9C8B3" }}>
          Each dot is one cookie · {drop.remaining} remaining
        </div>
      </div>

      <OpenCloseCard dropId={drop.id} isOpen={drop.isOpen} deadlineLabel={drop.deadlineLabel} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {pipeline.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            style={{
              background: "#FBF8F1",
              borderRadius: 14,
              padding: "16px 12px",
              textAlign: "left",
              color: "#24150D",
            }}
          >
            <div className="font-display" style={{ fontSize: 34, lineHeight: 1 }}>
              {p.n}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.3, color: "#5A4334" }}>{p.label}</div>
          </Link>
        ))}
      </div>

      <PickupAddressCard initial={pickupAddress} />

      <Link
        href="/dashboard/whats-next"
        style={{
          textAlign: "center",
          fontSize: 10,
          letterSpacing: ".2em",
          fontWeight: 500,
          color: "#8A7466",
          padding: "8px 0",
        }}
      >
        WHAT&apos;S NEXT FOR MANNA →
      </Link>
    </main>
  );
}
