"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Home", match: (p: string) => p === "/dashboard" },
  { href: "/dashboard/orders", label: "Orders", match: (p: string) => p.startsWith("/dashboard/orders") },
  { href: "/dashboard/drops", label: "Bake", match: (p: string) => p.startsWith("/dashboard/drops") },
  {
    href: "/dashboard/customers",
    label: "Customers",
    match: (p: string) => p.startsWith("/dashboard/customers"),
  },
];

export default function TabBar({ newOrders }: { newOrders: number }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-brown/10 bg-cream-raised"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-[760px]">
        {TABS.map((t) => {
          const active = t.match(pathname);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`relative flex flex-1 flex-col items-center gap-1 py-3.5 ${
                active ? "text-ink" : "text-muted-2"
              }`}
            >
              <span
                className={`h-0.5 w-6 rounded-full ${active ? "bg-ink" : "bg-transparent"}`}
              />
              <span className="eyebrow" style={{ fontSize: "9.5px" }}>
                {t.label}
                {t.label === "Orders" && newOrders > 0 && (
                  <span className="absolute -mt-1.5 ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brown px-1 text-[9px] font-semibold tracking-normal text-cream">
                    {newOrders}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
