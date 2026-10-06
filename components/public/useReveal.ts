"use client";

import { useEffect } from "react";

/**
 * Scroll-reveal: elements with [data-reveal] get `.revealed` + a variant class
 * when they enter the viewport. Delay via data-delay="ms".
 */
export function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          const delay = Number(el.dataset.delay ?? 0);
          const variant = el.dataset.reveal || "up";
          window.setTimeout(() => {
            el.classList.add("revealed", `reveal-${variant}`);
          }, delay);
          io.unobserve(el);
        }
      },
      { threshold: 0.18 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
