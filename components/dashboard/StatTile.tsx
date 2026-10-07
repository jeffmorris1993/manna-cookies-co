"use client";

import { useEffect, useRef, useState } from "react";

/** Animated count-up stat tile (900ms cubic ease, like the prototype's tween). */
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
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  return (
    <div className="border border-brown/10 bg-cream-raised px-4 py-5 text-center">
      <div className="font-display text-3xl font-medium text-ink" style={{ fontVariantNumeric: "tabular-nums" }}>
        {prefix}
        {display.toLocaleString()}
      </div>
      <div className="eyebrow mt-2 text-muted-2" style={{ fontSize: "8.5px" }}>
        {label}
      </div>
    </div>
  );
}
