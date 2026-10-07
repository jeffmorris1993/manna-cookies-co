"use client";

import { useEffect, useRef } from "react";

/**
 * Falling-crumbs canvas, ported verbatim from the design file's crumbs():
 * mixed squares/dots, sway, rotation. `once` lets particles fall through
 * a single pass (intro); otherwise they recycle (story section).
 */
export default function Crumbs({
  n,
  color,
  speed,
  alpha,
  once = false,
  top = false,
  className,
}: {
  n: number;
  color: string; // "r,g,b"
  speed: number;
  alpha: number;
  once?: boolean;
  top?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    let raf = 0;

    const size = () => {
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();

    type P = {
      x: number; y: number; r: number; vy: number; sw: number;
      rot: number; vr: number; sq: boolean; a: number;
    };
    const mk = (init: boolean): P => ({
      x: Math.random() * w,
      y: init ? (top ? -Math.random() * h * 0.3 - 8 : Math.random() * h) : -10,
      r: 0.7 + Math.random() * 2.1,
      vy: (0.25 + Math.random() * 0.6) * speed,
      sw: Math.random() * 6.28,
      rot: Math.random() * 6.28,
      vr: (Math.random() - 0.5) * 0.05,
      sq: Math.random() < 0.55,
      a: 0.35 + Math.random() * 0.6,
    });
    const ps: P[] = [];
    for (let i = 0; i < n; i++) ps.push(mk(true));

    const loop = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        p.y += p.vy;
        p.sw += 0.02;
        p.x += Math.sin(p.sw) * 0.3;
        p.rot += p.vr;
        if (p.y > h + 10) {
          if (once) continue;
          Object.assign(p, mk(false));
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = `rgba(${color},${p.a * alpha})`;
        if (p.sq) ctx.fillRect(-p.r, -p.r * 0.7, p.r * 2, p.r * 1.4);
        else {
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, 6.28);
          ctx.fill();
        }
        ctx.restore();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const ro = new ResizeObserver(size);
    ro.observe(cv);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [n, color, speed, alpha, once, top]);

  return <canvas ref={ref} aria-hidden className={className} />;
}
