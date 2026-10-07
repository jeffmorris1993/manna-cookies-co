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

  const [{ data: customers }, { data: orders }] = await Promise.all([
    supabase.from("customers").select("id, name, phone, email"),
    supabase
      .from("orders")
      .select("customer_id, price_cents, paid, status, created_at")
      .in("status", ["new", "preparing", "ready", "picked"]),
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

  return (
    <main className="pt-8">
      <h1 className="font-display text-4xl font-medium text-ink">Customers</h1>
      <CustomerList customers={summaries} />
    </main>
  );
}
