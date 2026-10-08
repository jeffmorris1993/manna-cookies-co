import { connection } from "next/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { formatMoney, parseISODate } from "@/lib/format";
import CreateNextDropButton from "@/components/dashboard/CreateNextDropButton";
import EmptyState from "@/components/dashboard/EmptyState";

/* DSTAT pill styles — verbatim from the design */
const DSTAT: Record<string, { l: string; bg: string; c: string; b: string }> = {
  live: { l: "LIVE", bg: "#24150D", c: "#F5EFE4", b: "#24150D" },
  scheduled: { l: "UP NEXT", bg: "#EADCC6", c: "#4A2616", b: "#EADCC6" },
  complete: { l: "COMPLETE", bg: "transparent", c: "#6E5546", b: "rgba(74,38,22,.3)" },
};

function dropDate(iso: string): string {
  return parseISODate(iso)
    .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    .toUpperCase();
}

export default async function DropsPage() {
  await connection();
  let supabase;
  try {
    ({ supabase } = await requireOwner());
  } catch {
    redirect("/login");
  }

  const [{ data: drops }, { data: orderAgg }] = await Promise.all([
    supabase
      .from("drops")
      .select("id, cookie, pickup_date, capacity, status, is_open")
      .order("pickup_date", { ascending: false }),
    supabase
      .from("orders")
      .select("drop_id, cookie_count, price_cents, paid, status")
      .in("status", ["new", "preparing", "ready", "picked"]),
  ]);

  const agg = new Map<string, { sold: number; revenue: number }>();
  for (const o of orderAgg ?? []) {
    const a = agg.get(o.drop_id) ?? { sold: 0, revenue: 0 };
    a.sold += o.cookie_count;
    if (o.paid) a.revenue += o.price_cents;
    agg.set(o.drop_id, a);
  }

  const sorted = [...(drops ?? [])].sort((a, b) => (a.pickup_date < b.pickup_date ? 1 : -1));
  const liveDrop = sorted.find((d) => d.status === "live");

  return (
    <main
      style={{ padding: "12px 0", display: "flex", flexDirection: "column", gap: 14, animation: "mannaIn .35s ease" }}
    >
      <h1 className="font-display" style={{ fontSize: 30, lineHeight: 1.1 }}>
        Drops
      </h1>

      {/* segmented control: THIS DROP ↔ ALL DROPS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 4,
          padding: 4,
          background: "#E6DCCB",
          borderRadius: 12,
        }}
      >
        <Link
          href={liveDrop ? `/dashboard/drops/${liveDrop.id}` : "/dashboard/drops"}
          style={{
            height: 44,
            borderRadius: 9,
            color: "#24150D",
            fontSize: 12,
            letterSpacing: ".16em",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          THIS DROP
        </Link>
        <span
          style={{
            height: 44,
            borderRadius: 9,
            background: "#FBF8F1",
            color: "#24150D",
            fontSize: 12,
            letterSpacing: ".16em",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 3px rgba(36,21,13,.15)",
          }}
        >
          ALL DROPS
        </span>
      </div>

      {sorted.length === 0 && (
        <EmptyState
          title="No drops yet."
          sub="A drop is one week's bake — the cookie, its capacity, pickup windows, and prices."
        />
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,300px),1fr))",
          gap: 10,
        }}
      >
        {sorted.map((d) => {
          const a = agg.get(d.id) ?? { sold: 0, revenue: 0 };
          const pct = d.capacity ? Math.min(100, Math.round((a.sold / d.capacity) * 100)) : 0;
          const st = DSTAT[d.status]!;
          return (
            <Link
              key={d.id}
              href={`/dashboard/drops/${d.id}`}
              style={{
                textAlign: "left",
                border: `1px solid ${d.status === "live" ? "#4A2616" : "rgba(74,38,22,.12)"}`,
                background: "#FBF8F1",
                borderRadius: 16,
                padding: 16,
                color: "#24150D",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, letterSpacing: ".16em", fontWeight: 500, color: "#8A6440" }}>
                    {dropDate(d.pickup_date)}
                  </div>
                  <div className="font-display" style={{ marginTop: 4, fontSize: 20, lineHeight: 1.2 }}>
                    {d.cookie || "Untitled cookie"}
                  </div>
                </div>
                <span
                  style={{
                    flex: "0 0 auto",
                    fontSize: 10,
                    letterSpacing: ".16em",
                    fontWeight: 600,
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: st.bg,
                    color: st.c,
                    border: `1px solid ${st.b}`,
                  }}
                >
                  {d.status === "live" && !d.is_open ? "LIVE · CLOSED" : st.l}
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: 4,
                  borderRadius: 2,
                  background: "rgba(74,38,22,.12)",
                  overflow: "hidden",
                }}
              >
                <div style={{ height: "100%", width: `${pct}%`, background: "#4A2616" }} />
              </div>
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  fontSize: 13,
                  color: "#5A4334",
                }}
              >
                <span>
                  {a.sold} / {d.capacity} {d.status === "complete" ? "sold" : "reserved"}
                </span>
                <span>{formatMoney(a.revenue)}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <CreateNextDropButton fromDropId={liveDrop?.id ?? sorted[0]?.id ?? null} />
    </main>
  );
}
