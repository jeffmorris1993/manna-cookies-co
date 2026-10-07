"use client";

import { useEffect, useRef, useState } from "react";

/** Count-up stat tile — rounded card, label above value, per the design. */
export default function StatTile({
  label,
  value,
  prefix = "",
}: {
  label: string;
  value: number;
  prefix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const dur = 900;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  return (
    <div style={{ background: "#FBF8F1", borderRadius: 14, padding: "16px 16px 14px" }}>
      <div style={{ fontSize: 11, letterSpacing: ".16em", fontWeight: 500, color: "#6E5546" }}>
        {label}
      </div>
      <div
        className="font-display"
        style={{ marginTop: 8, fontSize: 40, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}
      >
        {prefix}
        {display.toLocaleString()}
      </div>
    </div>
  );
}
