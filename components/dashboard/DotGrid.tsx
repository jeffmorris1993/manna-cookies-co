"use client";

import { useEffect, useState } from "react";

/** One dot per cookie; reserved dots fill in with a staggered sweep. */
export default function DotGrid({ capacity, reserved }: { capacity: number; reserved: number }) {
  const [filled, setFilled] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFilled(reserved);
      return;
    }
    const start = performance.now();
    const dur = 900;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setFilled(Math.round(reserved * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reserved]);

  return (
    <div className="mt-4 grid grid-cols-12 gap-1.5">
      {Array.from({ length: capacity }, (_, i) => (
        <span
          key={i}
          className="aspect-square w-full rounded-full"
          style={{ background: i < filled ? "#C9A57E" : "rgba(245,239,228,.14)" }}
        />
      ))}
    </div>
  );
}
