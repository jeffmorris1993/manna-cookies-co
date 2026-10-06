"use client";

import { useEffect, useState } from "react";
import type { LiveDropView } from "@/lib/types";

export default function StickyOrderBar({
  drop,
  sheetOpen,
  onOrder,
}: {
  drop: LiveDropView;
  sheetOpen: boolean;
  onOrder: () => void;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const past = window.scrollY > window.innerHeight * 0.85;
      const orderEl = document.getElementById("order");
      let orderVisible = false;
      if (orderEl) {
        const r = orderEl.getBoundingClientRect();
        orderVisible = r.top < window.innerHeight && r.bottom > 0;
      }
      setShow(past && !orderVisible);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!drop.orderable || sheetOpen || !show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-4 sm:p-5">
      <div
        className="mx-auto flex max-w-xl items-center justify-between gap-4 rounded-full bg-ink px-6 py-3.5 text-cream shadow-sticky"
        style={{ animation: "mannaRise .5s cubic-bezier(.2,.7,.2,1) both" }}
      >
        <div className="min-w-0">
          <div className="truncate font-display text-sm italic">{drop.cookie}</div>
          <div className="eyebrow mt-0.5 text-cream-dark-muted" style={{ fontSize: "9px" }}>
            {drop.availLine}
          </div>
        </div>
        <button
          onClick={onOrder}
          className="eyebrow flex-none rounded-full bg-cream px-6 py-2.5 text-ink transition-all duration-300 hover:tracking-[0.42em]"
        >
          Order
        </button>
      </div>
    </div>
  );
}
