"use client";

import { useEffect, useRef } from "react";

/** Ambient falling-crumbs canvas, ported from the prototype's crumbs() system. */
export default function Crumbs({
  count,
  color,
  className,
}: {
  count: number;
  color: string; // "r,g,b"
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type P = { x: number; y: number; r: number; vy: number; vx: number; a: number };
    let parts: P[] = [];

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      w = rect?.width ?? window.innerWidth;
      h = rect?.height ?? window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = (top: boolean): P => ({
      x: Math.random() * w,
      y: top ? -6 : Math.random() * h,
      r: 1 + Math.random() * 2.4,
      vy: 0.25 + Math.random() * 0.7,
      vx: (Math.random() - 0.5) * 0.25,
      a: 0.25 + Math.random() * 0.5,
    });

    resize();
    parts = Array.from({ length: count }, () => spawn(false));

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.y += p.vy;
        p.x += p.vx;
        if (p.y > h + 8) parts[i] = spawn(true);
        ctx.fillStyle = `rgba(${color},${p.a})`;
        ctx.fillRect(p.x, p.y, p.r, p.r);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [count, color]);

  return <canvas ref={ref} aria-hidden className={className} />;
}
