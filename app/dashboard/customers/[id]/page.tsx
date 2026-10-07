import { connection } from "next/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { formatMoney, displayOrderNumber } from "@/lib/format";
import { PACKAGE_META, type PackageKind } from "@/lib/types";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  let supabase;
  try {
    ({ supabase } = await requireOwner());
  } catch {
    redirect("/login");
  }
  const { id } = await params;

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, phone, email, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!customer) notFound();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, package, price_cents, paid, status, created_at, drops(cookie)")
    .eq("customer_id", id)
    .in("status", ["new", "preparing", "ready", "picked"])
    .order("created_at", { ascending: false });

  const rows = (orders ?? []) as unknown as Array<{
    id: string;
    order_number: number;
    package: PackageKind;
    price_cents: number;
    paid: boolean;
    status: string;
    created_at: string;
    drops: { cookie: string } | null;
  }>;

  const totalSpent = rows.filter((o) => o.paid).reduce((s, o) => s + o.price_cents, 0);
  const lastOrder = rows[0]
    ? new Date(rows[0].created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "—";

  return (
    <main style={{ padding: "12px 0", animation: "mannaIn .35s ease" }}>
      <Link href="/dashboard/customers" style={{ fontSize: 14, color: "#4A2616", padding: "4px 0" }}>
        ← All customers
      </Link>
      <div style={{ marginTop: 6, background: "#FBF8F1", borderRadius: 16, padding: 20 }}>
        <div className="font-display" style={{ fontSize: 28 }}>
          {customer.name}
        </div>
        <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: "8px 18px", fontSize: 14 }}>
          <a href={`tel:${customer.phone}`}>{customer.phone}</a>
          {customer.email && <a href={`mailto:${customer.email}`}>{customer.email}</a>}
        </div>
        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {(
            [
              ["TOTAL ORDERS", String(rows.length)],
              ["TOTAL SPENT", formatMoney(totalSpent)],
              ["LAST ORDER", lastOrder],
            ] as const
          ).map(([l, v]) => (
            <div key={l}>
              <div style={{ fontSize: 10, letterSpacing: ".14em", color: "#6E5546" }}>{l}</div>
              <div className="font-display" style={{ fontSize: 26, marginTop: 2 }}>
                {v}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 14, fontSize: 11, letterSpacing: ".2em", fontWeight: 500, color: "#6E5546" }}>
        ORDER HISTORY
      </div>
      <div style={{ marginTop: 8, background: "#FBF8F1", borderRadius: 16, overflow: "hidden" }}>
        {rows.length === 0 && (
          <div style={{ padding: "36px 20px", textAlign: "center" }}>
            <div className="font-display" style={{ fontSize: 18, color: "#24150D" }}>
              No orders yet.
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: "#6E5546" }}>
              Their first manna will show up here.
            </div>
          </div>
        )}
        {rows.map((o) => (
          <div
            key={o.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              padding: "14px 16px",
              borderBottom: "1px solid rgba(74,38,22,.1)",
              fontSize: 14,
            }}
          >
            <div>
              <div style={{ fontWeight: 500 }}>
                {PACKAGE_META[o.package].name}
                {o.drops?.cookie ? ` · ${o.drops.cookie}` : ""}
              </div>
              <div style={{ color: "#6E5546", marginTop: 2 }}>
                {displayOrderNumber(o.order_number)} ·{" "}
                {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            </div>
            <div className="font-display" style={{ fontSize: 18 }}>
              {formatMoney(o.price_cents)}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
