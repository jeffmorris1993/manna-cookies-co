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
    <main className="pt-8">
      <Link href="/dashboard/customers" className="eyebrow text-muted-2 hover:text-brown">
        ← All customers
      </Link>
      <h1 className="mt-3 font-display text-4xl font-medium text-ink">{customer.name}</h1>
      <p className="mt-2 text-sm">
        <a href={`tel:${customer.phone}`} className="text-brown underline-offset-2 hover:underline">
          {customer.phone}
        </a>
        {customer.email && (
          <>
            <span className="text-muted-2"> · </span>
            <a
              href={`mailto:${customer.email}`}
              className="text-brown underline-offset-2 hover:underline"
            >
              {customer.email}
            </a>
          </>
        )}
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          [String(rows.length), "Total Orders"],
          [formatMoney(totalSpent), "Total Spent"],
          [lastOrder, "Last Order"],
        ].map(([v, l]) => (
          <div key={l} className="border border-brown/10 bg-cream-raised px-3 py-5 text-center">
            <div className="font-display text-2xl font-medium text-ink">{v}</div>
            <div className="eyebrow mt-2 text-muted-2" style={{ fontSize: "8px" }}>
              {l}
            </div>
          </div>
        ))}
      </div>

      <h2 className="eyebrow mt-8 text-muted-2">Order History</h2>
      <div className="mt-3 flex flex-col gap-3">
        {rows.length === 0 && (
          <p className="border border-brown/10 bg-cream-raised px-5 py-6 text-center text-sm text-muted">
            No orders yet.
          </p>
        )}
        {rows.map((o) => (
          <div
            key={o.id}
            className="flex items-center justify-between gap-4 border border-brown/10 bg-cream-raised px-5 py-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-ink">
                {PACKAGE_META[o.package].name} · {o.drops?.cookie ?? ""}
              </p>
              <p className="mt-0.5 text-xs text-muted-2">
                {displayOrderNumber(o.order_number)} ·{" "}
                {new Date(o.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <p className="flex-none font-display text-lg text-ink">{formatMoney(o.price_cents)}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
