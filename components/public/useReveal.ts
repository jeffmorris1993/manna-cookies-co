"use client";

import { useEffect } from "react";

type AnimEl = HTMLElement & { _anim?: Animation; _anims?: Animation[] };

/**
 * Scroll systems ported from the design file (Manna.dc.html):
 * - data-reveal="mask|up|fade|scale" via the Web Animations API,
 *   threshold .12, rootMargin -6%, easing cubic-bezier(.2,.7,.2,1)
 * - data-parallax="<f>" translate relative to viewport center
 * Returns nothing; call once in the page shell. `onOrderSeen` fires the
 * availability-bar fill when the #order section first enters view.
 */
export function useReveal(onOrderSeen?: () => void) {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const orderEl = document.getElementById("order");
    let seenFired = false;

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          ((e.target as AnimEl)._anims || []).forEach((a) => a.play());
          if (e.target === orderEl && !seenFired) {
            seenFired = true;
            window.setTimeout(() => onOrderSeen?.(), 300);
          }
          io.unobserve(e.target);
        }),
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    document.querySelectorAll<AnimEl>("[data-reveal]").forEach((el) => {
      const k = el.dataset.reveal;
      const node = (k === "mask" ? el.parentElement : el) as AnimEl;
      if (!node) return;
      if (reduced) return; // leave fully visible
      if (!el._anim) {
        const fr =
          k === "mask"
            ? [{ transform: "translateY(108%)" }, { transform: "none" }]
            : k === "scale"
              ? [
                  { transform: "scale(1.16)", opacity: 0.3 },
                  { transform: "none", opacity: 1 },
                ]
              : k === "fade"
                ? [{ opacity: 0 }, { opacity: 1 }]
                : [
                    { opacity: 0, transform: "translateY(28px)" },
                    { opacity: 1, transform: "none" },
                  ];
        el._anim = el.animate(fr, {
          duration: k === "scale" ? 1700 : k === "mask" ? 1050 : 950,
          delay: +(el.dataset.delay || 0),
          easing: "cubic-bezier(.2,.7,.2,1)",
          fill: "both",
        });
        el._anim.pause();
        (node._anims = node._anims || []).push(el._anim);
      }
      if (el._anim.playState !== "finished") io.observe(node);
    });

    if (orderEl) io.observe(orderEl);

    // parallax
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
          const parent = el.parentElement;
          if (!parent) return;
          const r = parent.getBoundingClientRect();
          const f = +(el.dataset.parallax || 0);
          el.style.transform = `translate3d(0,${(r.top + r.height / 2 - window.innerHeight / 2) * -f}px,0)`;
        });
      });
    };
    if (!reduced) {
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [onOrderSeen]);
}
