"use client";

import Image from "next/image";

export default function SiteFooter({ onReplayIntro }: { onReplayIntro: () => void }) {
  return (
    <footer className="bg-cream-raised">
      <div className="ribbon-sm" role="presentation" />
      <div className="mx-auto max-w-3xl px-6 py-16 text-center sm:py-20">
        <Image
          src="/logo.png"
          alt="Manna Cookies & Co. logo"
          width={128}
          height={128}
          className="mx-auto h-28 w-28 sm:h-32 sm:w-32"
        />

        <nav className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="eyebrow text-brown transition-[letter-spacing] duration-300 hover:tracking-[0.42em]"
          >
            Instagram
          </a>
          <a
            href="mailto:hello@mannacookies.co"
            className="eyebrow text-brown transition-[letter-spacing] duration-300 hover:tracking-[0.42em]"
          >
            Contact
          </a>
          <a
            href="#order"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("order")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="eyebrow text-brown transition-[letter-spacing] duration-300 hover:tracking-[0.42em]"
          >
            Pickup Info
          </a>
        </nav>

        <p className="mt-8 text-sm leading-relaxed text-muted">
          Pickup by reservation.
          <br />
          Your pickup address is sent with your confirmation.
        </p>

        <p className="mt-10 font-display text-xl text-ink">Manna Cookies &amp; Co.</p>
        <p className="mt-1 font-display italic text-brown-muted">Straight From Heaven.</p>

        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            onClick={onReplayIntro}
            className="eyebrow text-muted-2 transition-colors hover:text-brown"
          >
            EST. 2023 · Replay Intro
          </button>
          <span className="eyebrow text-muted-2" style={{ fontSize: "9px" }}>
            Powered by Sirrom Studios
          </span>
        </div>
      </div>
    </footer>
  );
}
