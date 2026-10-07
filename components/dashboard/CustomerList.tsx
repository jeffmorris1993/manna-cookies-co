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
    <div style={{ marginTop: 12, animation: "mannaIn .35s ease" }}>
      <input
        type="search"
        placeholder="Search customers..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{
          width: "100%",
          height: 52,
          border: "1px solid rgba(74,38,22,.2)",
          borderRadius: 12,
          background: "#FBF8F1",
          padding: "0 16px",
          fontSize: 16,
          color: "#24150D",
          outline: "none",
        }}
      />
      <div style={{ marginTop: 12, background: "#FBF8F1", borderRadius: 16, overflow: "hidden" }}>
        {filtered.length === 0 && (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#6E5546", fontSize: 14 }}>
            No customers yet.
          </div>
        )}
        {filtered.map((c) => (
          <Link
            key={c.id}
            href={`/dashboard/customers/${c.id}`}
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              borderBottom: "1px solid rgba(74,38,22,.1)",
              color: "#24150D",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 16 }}>{c.name}</div>
              <div
                style={{
                  fontSize: 13,
                  color: "#6E5546",
                  marginTop: 2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {c.phone}
                {c.email ? ` · ${c.email}` : ""}
              </div>
            </div>
            <div style={{ flex: "0 0 auto", textAlign: "right" }}>
              <div className="font-display" style={{ fontSize: 20 }}>
                {formatMoney(c.spentCents)}
              </div>
              <div style={{ fontSize: 12, color: "#6E5546" }}>
                {c.orderCount} {c.orderCount === 1 ? "order" : "orders"}
                {c.lastOrder ? ` · last ${c.lastOrder}` : ""}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
