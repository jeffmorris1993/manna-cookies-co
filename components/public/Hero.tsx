"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/* shared geometry: 28% vertical overscan so the parallax shift (max ~12% of
   hero height) can never slide the media off its frame and expose the backdrop.
   maxWidth:none — Tailwind preflight clamps <video>/<img> to max-width:100%,
   which silently defeats the 108% overscan. */
const MEDIA_BOX: React.CSSProperties = {
  top: "-14%",
  left: "-4%",
  width: "108%",
  height: "128%",
  maxWidth: "none",
};

export default function Hero({ onOrder }: { onOrder: (e?: React.MouseEvent) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [still, setStill] = useState(false); // Low Power Mode etc: show photo

  // iOS Low Power Mode blocks video autoplay. Fall back to the photo, and
  // retry on the first touch — a user gesture is allowed to start playback.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let timer = 0;

    const tryPlay = () => {
      const p = v.play();
      if (p?.catch) p.catch(() => {});
    };
    const onPlaying = () => {
      setStill(false);
      window.clearTimeout(timer);
    };
    const onFirstTouch = () => tryPlay();

    v.addEventListener("playing", onPlaying);
    window.addEventListener("touchstart", onFirstTouch, { once: true, passive: true });
    tryPlay();
    timer = window.setTimeout(() => {
      if (v.paused) setStill(true);
    }, 1500);

    return () => {
      window.clearTimeout(timer);
      v.removeEventListener("playing", onPlaying);
      window.removeEventListener("touchstart", onFirstTouch);
    };
  }, []);

  return (
    <section
      data-screen-label="Hero"
      className="relative overflow-hidden"
      style={{ height: "100svh", minHeight: 580, background: "#1B0F09", color: "#F5EFE4" }}
    >
      <div data-parallax=".12" className="absolute inset-0">
        <video
          ref={videoRef}
          src="/hero.mp4"
          poster="/cookie-stack.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute object-cover"
          style={MEDIA_BOX}
        />
        {still && (
          /* covers the paused video (and iOS's play glyph) with the same shot */
          <img
            src="/cookie-stack.jpg"
            alt=""
            className="absolute object-cover"
            style={{ ...MEDIA_BOX, animation: "mannaFade .4s ease" }}
          />
        )}
      </div>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg,rgba(27,15,9,.6) 0%,rgba(27,15,9,.2) 38%,rgba(27,15,9,.88) 100%)",
        }}
      />

      <div
        className="absolute inset-x-0 top-0 z-[3] flex items-center justify-between"
        style={{ padding: "22px clamp(20px,5vw,56px)" }}
      >
        <span
          style={{ fontSize: 10, letterSpacing: ".3em", fontWeight: 500, color: "rgba(245,239,228,.85)" }}
        >
          SMALL BATCH · WEEKLY
        </span>
        <a
          href="#order"
          onClick={onOrder}
          style={{
            color: "#F5EFE4",
            fontSize: 11,
            letterSpacing: ".24em",
            fontWeight: 500,
            padding: "10px 0",
            borderBottom: "1px solid rgba(245,239,228,.5)",
          }}
        >
          ORDER
        </a>
      </div>

      <div
        className="absolute inset-0 z-[2] flex flex-col items-center justify-end text-center"
        style={{ padding: "84px clamp(20px,5vw,56px) 96px" }}
      >
        <Image
          data-reveal="fade"
          data-delay="80"
          src="/logo-hero.png"
          alt="Manna Cookies & Co."
          width={150}
          height={150}
          priority
          style={{ width: "clamp(72px,min(22vw,17svh),150px)", height: "auto", display: "block", flex: "0 0 auto" }}
        />
        <h1
          className="font-display"
          style={{
            margin: "clamp(14px,3svh,26px) 0 0",
            fontWeight: 500,
            fontSize: "clamp(36px,min(10.5vw,11svh),128px)",
            lineHeight: 0.94,
            letterSpacing: ".01em",
          }}
        >
          <span style={{ display: "block", overflow: "hidden", paddingBottom: ".05em" }}>
            <span data-reveal="mask" data-delay="200" style={{ display: "block" }}>
              STRAIGHT
            </span>
          </span>
          <span style={{ display: "block", overflow: "hidden", paddingBottom: ".05em" }}>
            <span data-reveal="mask" data-delay="330" style={{ display: "block" }}>
              FROM HEAVEN.
            </span>
          </span>
        </h1>
        <p
          data-reveal="up"
          data-delay="520"
          className="font-display italic"
          style={{ margin: "18px 0 0", fontSize: "clamp(18px,2.2vw,24px)" }}
        >
          One really good cookie, baked fresh each week.
        </p>
        <button
          data-reveal="up"
          data-delay="660"
          onClick={() => onOrder()}
          className="cursor-pointer border-0 transition-[background,letter-spacing] duration-300 hover:bg-white hover:tracking-[.26em]"
          style={{
            marginTop: 30,
            background: "#F5EFE4",
            color: "#24150D",
            padding: "19px 30px",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: ".22em",
          }}
        >
          ORDER THIS WEEK&apos;S MANNA
        </button>
      </div>

      <div
        className="absolute z-[2] overflow-hidden"
        style={{ bottom: 22, left: "50%", width: 1, height: 46, background: "rgba(245,239,228,.22)" }}
      >
        <div
          style={{ width: 1, height: "45%", background: "#F5EFE4", animation: "mannaScroll 2.2s ease-in-out infinite" }}
        />
      </div>
    </section>
  );
}
