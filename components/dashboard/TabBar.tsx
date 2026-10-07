"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "HOME", match: (p: string) => p === "/dashboard" },
  { href: "/dashboard/orders", label: "ORDERS", match: (p: string) => p.startsWith("/dashboard/orders") },
  { href: "/dashboard/drops", label: "BAKE", match: (p: string) => p.startsWith("/dashboard/drops") },
  { href: "/dashboard/customers", label: "CUSTOMERS", match: (p: string) => p.startsWith("/dashboard/customers") },
];

export default function TabBar({ newOrders }: { newOrders: number }) {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        background: "#FBF8F1",
        borderTop: "1px solid rgba(74,38,22,.12)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
        {TABS.map((t) => {
          const active = t.match(pathname);
          return (
            <Link
              key={t.href}
              href={t.href}
              style={{
                position: "relative",
                height: 66,
                color: active ? "#24150D" : "#8A7466",
                fontSize: 11,
                letterSpacing: ".16em",
                fontWeight: 600,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 2,
                  background: active ? "#4A2616" : "transparent",
                  transition: "background .3s",
                }}
              />
              <span>{t.label}</span>
              {t.label === "ORDERS" && newOrders > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 10,
                    right: "calc(50% - 34px)",
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    background: "#4A2616",
                    color: "#F5EFE4",
                    fontSize: 10,
                    letterSpacing: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 5px",
                  }}
                >
                  {newOrders}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
