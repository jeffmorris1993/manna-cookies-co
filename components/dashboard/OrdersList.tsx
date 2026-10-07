"use client";

import { useMemo, useState, useTransition } from "react";
import { updateOrderStatus } from "@/app/dashboard/actions";
import { formatMoney, windowLabel, displayOrderNumber } from "@/lib/format";
import { PACKAGE_META } from "@/lib/types";
import type { PackageKind } from "@/lib/types";
import { useToast } from "./Toast";
import EmptyState from "./EmptyState";

export type OrderRow = {
  id: string;
  order_number: number;
  package: PackageKind;
  cookie_count: number;
  price_cents: number;
  paid: boolean;
  status: "new" | "preparing" | "ready" | "picked";
  customers: { name: string; phone: string } | null;
  pickup_windows: { starts: string; ends: string } | null;
};

/* STATUS pill styles — verbatim from the design's STATUS map */
const STATUS: Record<OrderRow["status"], { l: string; bg: string; c: string; b: string }> = {
  new: { l: "NEW", bg: "#4A2616", c: "#F5EFE4", b: "#4A2616" },
  preparing: { l: "PREPARING", bg: "#EADCC6", c: "#4A2616", b: "#EADCC6" },
  ready: { l: "READY", bg: "#C9A57E", c: "#24150D", b: "#C9A57E" },
  picked: { l: "PICKED UP", bg: "transparent", c: "#6E5546", b: "rgba(74,38,22,.3)" },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "prepare", label: "To prepare" },
  { key: "ready", label: "Ready" },
  { key: "picked", label: "Picked up" },
];

export default function OrdersList({
  orders,
  initialFilter,
}: {
  orders: OrderRow[];
  initialFilter: string;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState(
    FILTERS.some((f) => f.key === initialFilter) ? initialFilter : "all",
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, start] = useTransition();
  const toast = useToast();

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter === "prepare" && o.status !== "new" && o.status !== "preparing") return false;
      if (filter === "ready" && o.status !== "ready") return false;
      if (filter === "picked" && o.status !== "picked") return false;
      if (!needle) return true;
      return (
        (o.customers?.name ?? "").toLowerCase().includes(needle) ||
        (o.customers?.phone ?? "").replace(/\D/g, "").includes(needle.replace(/\D/g, "") || " ")
      );
    });
  }, [orders, q, filter]);

  const setStatus = (o: OrderRow, status: OrderRow["status"], doneMsg: string) => {
    setPendingId(o.id);
    start(async () => {
      const res = await updateOrderStatus(o.id, status);
      toast(res.ok ? doneMsg : (res.error ?? "Couldn't update"));
      setPendingId(null);
    });
  };

  return (
    <div style={{ marginTop: 12, animation: "mannaIn .35s ease" }}>
      <input
        type="search"
        placeholder="Find customer..."
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
      <div style={{ marginTop: 12, display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {FILTERS.map((f) => {
          const on = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="cursor-pointer"
              style={{
                flex: "0 0 auto",
                height: 40,
                padding: "0 16px",
                borderRadius: 999,
                border: "1px solid rgba(74,38,22,.25)",
                background: on ? "#24150D" : "#FBF8F1",
                color: on ? "#F5EFE4" : "#24150D",
                fontSize: 12,
                letterSpacing: ".1em",
                fontWeight: 500,
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        {orders.length === 0 && (
          <EmptyState
            title="The oven's all yours."
            sub="No orders yet for this bake. They'll appear here the moment someone reserves their manna."
          />
        )}
        {orders.length > 0 && filtered.length === 0 && (
          <EmptyState
            compact
            title="No orders match."
            sub="Try a different name, phone number, or filter."
          >
            <button
              onClick={() => {
                setQ("");
                setFilter("all");
              }}
              className="cursor-pointer"
              style={{
                height: 44,
                padding: "0 20px",
                borderRadius: 999,
                border: "1px solid rgba(74,38,22,.3)",
                background: "transparent",
                color: "#4A2616",
                fontSize: 11,
                letterSpacing: ".16em",
                fontWeight: 600,
              }}
            >
              CLEAR SEARCH
            </button>
          </EmptyState>
        )}
        {filtered.map((o) => {
          const st = STATUS[o.status];
          const busy = pendingId === o.id;
          const win = o.pickup_windows
            ? windowLabel(o.pickup_windows.starts.slice(0, 5), o.pickup_windows.ends.slice(0, 5))
            : "—";
          const prim =
            o.status === "ready"
              ? { l: "MARK PICKED UP", bg: "#C9A57E", c: "#24150D", to: "picked" as const, msg: "Picked up" }
              : o.status === "picked"
                ? { l: "UNDO PICKUP", bg: "#EADCC6", c: "#4A2616", to: "ready" as const, msg: "Moved back to ready" }
                : { l: "MARK READY", bg: "#24150D", c: "#F5EFE4", to: "ready" as const, msg: "Marked ready" };
          return (
            <div
              key={o.id}
              style={{
                background: "#FBF8F1",
                borderRadius: 16,
                padding: 16,
                opacity: o.status === "picked" ? 0.6 : 1,
                transition: "opacity .3s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div className="font-display" style={{ fontSize: 21, lineHeight: 1.2 }}>
                    {o.customers?.name ?? "Customer"}
                  </div>
                  <a href={`tel:${o.customers?.phone ?? ""}`} style={{ fontSize: 14, color: "#5A4334" }}>
                    {o.customers?.phone}
                  </a>
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
                  {st.l}
                </span>
              </div>

              <div
                style={{
                  marginTop: 12,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px 14px",
                  fontSize: 14,
                }}
              >
                {(
                  [
                    ["ORDER", `${PACKAGE_META[o.package].name} · ${displayOrderNumber(o.order_number)}`],
                    ["QUANTITY", `${o.cookie_count} cookies`],
                    [
                      "AMOUNT",
                      <span key="a">
                        {formatMoney(o.price_cents)} ·{" "}
                        <span style={{ fontWeight: 600, color: o.paid ? "#4A2616" : "#8A3B1E" }}>
                          {o.paid ? "PAID" : "UNPAID"}
                        </span>
                      </span>,
                    ],
                    ["PICKUP", win],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k as string}>
                    <div style={{ fontSize: 10, letterSpacing: ".16em", color: "#6E5546" }}>{k}</div>
                    <div style={{ marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                {o.status === "new" && (
                  <button
                    disabled={busy}
                    onClick={() => setStatus(o, "preparing", "Marked preparing")}
                    className="cursor-pointer disabled:opacity-50"
                    style={{
                      flex: 1,
                      height: 56,
                      borderRadius: 12,
                      border: "1px solid #4A2616",
                      background: "transparent",
                      color: "#24150D",
                      fontSize: 12,
                      letterSpacing: ".14em",
                      fontWeight: 600,
                    }}
                  >
                    START PREPARING
                  </button>
                )}
                <button
                  disabled={busy}
                  onClick={() => setStatus(o, prim.to, prim.msg)}
                  className="cursor-pointer border-0 disabled:opacity-50"
                  style={{
                    flex: 1.4,
                    height: 56,
                    borderRadius: 12,
                    background: prim.bg,
                    color: prim.c,
                    fontSize: 12,
                    letterSpacing: ".16em",
                    fontWeight: 600,
                  }}
                >
                  {prim.l}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
