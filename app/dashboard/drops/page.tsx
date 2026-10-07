import { connection } from "next/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { shortDate, formatMoney } from "@/lib/format";
import CreateNextDropButton from "@/components/dashboard/CreateNextDropButton";

const DSTAT: Record<string, { label: string; cls: string }> = {
  live: { label: "LIVE", cls: "bg-brown text-cream" },
  scheduled: { label: "UP NEXT", cls: "bg-tan-soft text-ink" },
  complete: { label: "COMPLETE", cls: "border border-brown/30 text-muted" },
};

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
      .select("id, cookie, pickup_date, capacity, status")
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

  const liveFirst = (drops ?? []).sort((a, b) => {
    const rank = (s: string) => (s === "live" ? 0 : s === "scheduled" ? 1 : 2);
    return rank(a.status) - rank(b.status) || (a.pickup_date < b.pickup_date ? 1 : -1);
  });

  const liveDrop = liveFirst.find((d) => d.status === "live");

  return (
    <main className="pt-8">
      <h1 className="font-display text-4xl font-medium text-ink">Drops</h1>

      <div className="mt-6 flex flex-col gap-4">
        {liveFirst.map((d) => {
          const a = agg.get(d.id) ?? { sold: 0, revenue: 0 };
          const pct = d.capacity ? Math.min(100, Math.round((a.sold / d.capacity) * 100)) : 0;
          const st = DSTAT[d.status]!;
          return (
            <Link
              key={d.id}
              href={`/dashboard/drops/${d.id}`}
              className={`block border bg-cream-raised px-5 py-5 transition-colors hover:border-brown/50 ${
                d.status === "live" ? "border-brown" : "border-brown/10"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow text-muted-2" style={{ fontSize: "8.5px" }}>
                    {shortDate(d.pickup_date)}
                  </p>
                  <p className="mt-1 font-display text-xl text-ink">{d.cookie}</p>
                </div>
                <span className={`eyebrow rounded-full px-3 py-1.5 ${st.cls}`} style={{ fontSize: "8px" }}>
                  {st.label}
                </span>
              </div>
              <div className="mt-4 h-1 w-full overflow-hidden rounded bg-brown/10">
                <div className="h-full rounded bg-gold" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted">
                <span>
                  {a.sold} / {d.capacity} {d.status === "complete" ? "sold" : "reserved"}
                </span>
                <span>{formatMoney(a.revenue)}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <CreateNextDropButton fromDropId={liveDrop?.id ?? liveFirst[0]?.id ?? null} />
    </main>
  );
}
