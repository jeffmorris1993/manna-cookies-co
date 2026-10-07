"use client";

import { useEffect, useState } from "react";

/** One bordered dot per cookie; reserved dots fill gold with a count-up sweep. */
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
    <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 5 }}>
      {Array.from({ length: capacity }, (_, i) => (
        <div
          key={i}
          style={{
            aspectRatio: "1",
            borderRadius: "50%",
            background: i < filled ? "#C9A57E" : "transparent",
            border: "1px solid #8A6440",
            transition: "background .4s",
          }}
        />
      ))}
    </div>
  );
}
