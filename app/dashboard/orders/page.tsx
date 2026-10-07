import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import OrdersList, { type OrderRow } from "@/components/dashboard/OrdersList";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await connection();
  let supabase;
  try {
    ({ supabase } = await requireOwner());
  } catch {
    redirect("/login");
  }
  const { filter } = await searchParams;

  const { data: live } = await supabase
    .from("drops")
    .select("id")
    .eq("status", "live")
    .maybeSingle();

  let orders: OrderRow[] = [];
  if (live) {
    const { data } = await supabase
      .from("orders")
      .select(
        "id, order_number, package, cookie_count, price_cents, paid, status, customers(name, phone), pickup_windows(starts, ends)",
      )
      .eq("drop_id", live.id)
      .in("status", ["new", "preparing", "ready", "picked"])
      .order("order_number", { ascending: true });
    orders = (data ?? []) as unknown as OrderRow[];
  }

  return (
    <main className="pt-8">
      <h1 className="font-display text-4xl font-medium text-ink">Orders</h1>
      <OrdersList orders={orders} initialFilter={filter ?? "all"} />
    </main>
  );
}
