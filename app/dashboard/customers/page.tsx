import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import CustomerList, { type CustomerSummary } from "@/components/dashboard/CustomerList";

export default async function CustomersPage() {
  await connection();
  let supabase;
  try {
    ({ supabase } = await requireOwner());
  } catch {
    redirect("/login");
  }

  const [{ data: customers }, { data: orders }, { data: waitlist }] = await Promise.all([
    supabase.from("customers").select("id, name, phone, email"),
    supabase
      .from("orders")
      .select("customer_id, price_cents, paid, status, created_at")
      .in("status", ["new", "preparing", "ready", "picked"]),
    supabase
      .from("waitlist_entries")
      .select("id, contact, created_at, drops(cookie)")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const byCustomer = new Map<string, { spent: number; count: number; last: string }>();
  for (const o of orders ?? []) {
    const c = byCustomer.get(o.customer_id) ?? { spent: 0, count: 0, last: "" };
    c.count += 1;
    if (o.paid) c.spent += o.price_cents;
    if (!c.last || o.created_at > c.last) c.last = o.created_at;
    byCustomer.set(o.customer_id, c);
  }

  const summaries: CustomerSummary[] = (customers ?? [])
    .map((c) => {
      const a = byCustomer.get(c.id) ?? { spent: 0, count: 0, last: "" };
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        spentCents: a.spent,
        orderCount: a.count,
        lastOrder: a.last
          ? new Date(a.last).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : null,
      };
    })
    .sort((a, b) => b.spentCents - a.spentCents);

  const waitRows = (waitlist ?? []) as unknown as Array<{
    id: string;
    contact: string;
    created_at: string;
    drops: { cookie: string } | null;
  }>;

  return (
    <main style={{ padding: "12px 0" }}>
      <h1 className="font-display" style={{ fontSize: 30, lineHeight: 1.1 }}>Customers</h1>
      <CustomerList customers={summaries} />

      <div
        style={{
          marginTop: 28,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: ".2em", fontWeight: 500, color: "#6E5546" }}>
          WAITLIST
        </div>
        <div style={{ fontSize: 12, color: "#8A7466" }}>
          {waitRows.length === 0
            ? ""
            : `${waitRows.length} ${waitRows.length === 1 ? "person" : "people"} waiting`}
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        {waitRows.length === 0 ? (
          <div
            style={{
              background: "#FBF8F1",
              borderRadius: 16,
              padding: "24px 20px",
              textAlign: "center",
              fontSize: 13,
              color: "#6E5546",
            }}
          >
            Nobody waiting right now. Signups from &ldquo;Join the next drop&rdquo; land here.
          </div>
        ) : (
          <div style={{ background: "#FBF8F1", borderRadius: 16, overflow: "hidden" }}>
            {waitRows.map((w) => {
              const isEmail = w.contact.includes("@");
              return (
                <div
                  key={w.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    padding: "13px 16px",
                    borderBottom: "1px solid rgba(74,38,22,.1)",
                    fontSize: 14,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <a
                      href={isEmail ? `mailto:${w.contact}` : `sms:${w.contact}`}
                      style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {w.contact}
                    </a>
                    {w.drops?.cookie && (
                      <div style={{ fontSize: 12, color: "#8A7466", marginTop: 2 }}>
                        waiting since the {w.drops.cookie} drop
                      </div>
                    )}
                  </div>
                  <div style={{ flex: "0 0 auto", fontSize: 12, color: "#8A7466" }}>
                    {new Date(w.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
