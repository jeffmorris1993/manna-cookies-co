"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);

  // gentle parallax on the background video
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        v.style.transform = `translateY(${window.scrollY * 0.28}px) scale(1.06)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const scrollToOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("order")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      data-screen-label="Hero"
      className="relative flex min-h-[580px] flex-col overflow-hidden bg-ink-deep text-cream"
      style={{ height: "100svh" }}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src="/hero.mp4"
        poster="/cookie-stack.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(20,11,6,.62) 0%, rgba(20,11,6,.28) 45%, rgba(20,11,6,.78) 100%)",
        }}
      />

      <div className="relative z-10 flex flex-1 flex-col px-6 py-5 sm:px-10">
        <div className="flex items-center justify-between">
          <span className="eyebrow text-cream-dark-muted">Small Batch · Weekly</span>
          <a
            href="#order"
            onClick={scrollToOrder}
            className="eyebrow text-cream transition-[letter-spacing] duration-300 hover:tracking-[0.42em]"
          >
            Order
          </a>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <Image
            src="/logo-hero.png"
            alt="Manna Cookies & Co. logo"
            width={150}
            height={150}
            priority
            style={{ width: "clamp(72px, min(22vw, 17svh), 150px)", height: "auto" }}
          />
          <h1
            className="font-display font-medium"
            style={{
              margin: "clamp(14px,3svh,26px) 0 0",
              fontSize: "clamp(36px, min(10.5vw, 11svh), 128px)",
              lineHeight: 0.94,
              letterSpacing: ".01em",
            }}
          >
            <span className="block overflow-hidden">
              <span className="block" data-reveal="up">
                STRAIGHT
              </span>
            </span>
            <span className="block overflow-hidden">
              <span className="block" data-reveal="up" data-delay="140">
                FROM HEAVEN.
              </span>
            </span>
          </h1>
          <p
            className="mt-5 font-display italic text-cream-dark-muted"
            style={{ fontSize: "clamp(16px,2.4vw,22px)" }}
            data-reveal="fade"
            data-delay="400"
          >
            One really good cookie, baked fresh each week.
          </p>
          <a
            href="#order"
            onClick={scrollToOrder}
            data-reveal="up"
            data-delay="560"
            className="eyebrow mt-9 inline-block border border-cream/40 bg-cream px-8 py-4 text-ink transition-all duration-300 hover:tracking-[0.42em] hover:bg-cream-raised"
          >
            Order This Week&apos;s Manna
          </a>
        </div>

        <div className="flex justify-center pb-2">
          <span className="relative block h-12 w-px overflow-hidden bg-cream/20">
            <span
              className="absolute inset-0 bg-cream"
              style={{ animation: "mannaScroll 2.2s cubic-bezier(.2,.7,.2,1) infinite" }}
            />
          </span>
        </div>
      </div>
    </section>
  );
}
