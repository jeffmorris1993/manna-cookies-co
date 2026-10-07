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
      const y = window.scrollY;
      const orderEl = document.getElementById("order");
      let s = false;
      if (orderEl) {
        const r = orderEl.getBoundingClientRect();
        s = y > window.innerHeight * 0.85 && (r.top > window.innerHeight || r.bottom < 80);
      }
      setShow(s);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!drop.orderable || sheetOpen || !show) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: 12,
        zIndex: 50,
        maxWidth: 540,
        margin: "0 auto",
        background: "#24150D",
        color: "#F5EFE4",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 10px 10px 20px",
        boxShadow: "0 20px 40px -18px rgba(20,11,6,.6)",
        animation: "mannaIn .4s ease",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          className="font-display"
          style={{ fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {drop.cookie}
        </div>
        <div style={{ fontSize: 10, letterSpacing: ".16em", color: "#D9C8B3", marginTop: 3 }}>
          {drop.availLine}
        </div>
      </div>
      <button
        onClick={onOrder}
        className="cursor-pointer border-0"
        style={{
          flex: "0 0 auto",
          height: 48,
          background: "#F5EFE4",
          color: "#24150D",
          padding: "0 20px",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: ".2em",
        }}
      >
        ORDER
      </button>
    </div>
  );
}
