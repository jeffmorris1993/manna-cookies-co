"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";

export type CustomerSummary = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  spentCents: number;
  orderCount: number;
  lastOrder: string | null;
};

export default function CustomerList({ customers }: { customers: CustomerSummary[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        c.phone.replace(/\D/g, "").includes(needle.replace(/\D/g, "") || " ") ||
        (c.email ?? "").toLowerCase().includes(needle),
    );
  }, [customers, q]);

  return (
    <div className="mt-6">
      <input
        type="search"
        placeholder="Search customers..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full border border-brown/20 bg-cream-raised px-4 py-3.5 text-[15px] text-ink outline-none placeholder:text-muted-2 focus:border-brown"
      />
      <div className="mt-5 flex flex-col gap-3">
        {filtered.length === 0 && (
          <p className="border border-brown/10 bg-cream-raised px-5 py-8 text-center text-sm text-muted">
            No customers yet.
          </p>
        )}
        {filtered.map((c) => (
          <Link
            key={c.id}
            href={`/dashboard/customers/${c.id}`}
            className="flex items-center justify-between gap-4 border border-brown/10 bg-cream-raised px-5 py-4 transition-colors hover:border-brown/40"
          >
            <div className="min-w-0">
              <p className="truncate font-display text-lg text-ink">{c.name}</p>
              <p className="truncate text-xs text-muted-2">
                {c.phone}
                {c.email ? ` · ${c.email}` : ""}
              </p>
            </div>
            <div className="flex-none text-right">
              <p className="font-display text-xl text-ink">{formatMoney(c.spentCents)}</p>
              <p className="text-xs text-muted-2">
                {c.orderCount} {c.orderCount === 1 ? "order" : "orders"}
                {c.lastOrder ? ` · last ${c.lastOrder}` : ""}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
