"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveDropView, PackageKind } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import WaitlistForm from "./WaitlistForm";

export default function OrderSection({
  drop,
  onSelect,
}: {
  drop: LiveDropView;
  onSelect: (kind: PackageKind) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const unavailable = !drop.orderable;

  return (
    <section id="order" data-screen-label="Order" className="bg-cream-raised">
      <div className="ribbon" role="presentation" />
      <div className="mx-auto max-w-3xl px-6 py-20 text-center sm:px-10 sm:py-24">
        <span className="eyebrow text-brown-muted" data-reveal="fade">
          Order for Pickup
        </span>
        <h2
          className="mt-5 font-display font-medium text-ink"
          style={{ fontSize: "clamp(36px,5.5vw,68px)", lineHeight: 1.02 }}
          data-reveal="up"
        >
          {unavailable
            ? drop.soldOut
              ? "THIS WEEK'S MANNA IS GONE."
              : "ORDERS ARE CLOSED FOR THIS WEEK."
            : "THIS WEEK'S MANNA"}
        </h2>

        {!unavailable && (
          <>
            <p className="mt-6 font-display text-2xl italic text-brown" data-reveal="fade" data-delay="120">
              {drop.cookie}
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted" data-reveal="fade" data-delay="180">
              {drop.desc}
            </p>

            <div ref={barRef} className="mx-auto mt-10 max-w-md" data-reveal="fade" data-delay="220">
              <div className="flex items-baseline justify-between">
                <span className="eyebrow text-brown">{drop.availLine}</span>
                <span className="eyebrow text-muted-2">{drop.pickupShort}</span>
              </div>
              <div className="mt-3 h-[3px] w-full overflow-hidden rounded bg-brown/10">
                <div
                  className="h-full rounded bg-gold"
                  style={{
                    width: seen ? `${drop.pct}%` : "0%",
                    transition: "width 1.2s cubic-bezier(.2,.7,.2,1)",
                  }}
                />
              </div>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {drop.packages.map((pkg, i) => {
                  const disabled = !pkg.available;
                  return (
                    <button
                      key={pkg.kind}
                      disabled={disabled}
                      onClick={() => onSelect(pkg.kind)}
                      data-reveal="up"
                      data-delay={String(i * 120)}
                      className={`arch-card group border bg-cream-raised px-6 pb-7 pt-12 text-center transition-all duration-500 ${
                        disabled
                          ? "cursor-not-allowed border-brown/10 opacity-55"
                          : "border-brown/25 hover:-translate-y-1.5 hover:shadow-card-hover"
                      }`}
                    >
                      <div className="eyebrow text-ink">{pkg.title}</div>
                      <div className="mt-1 text-xs tracking-[0.18em] text-muted-2">
                        {pkg.sub.toUpperCase()}
                      </div>
                      <div className="mt-5 font-display text-4xl font-medium text-ink">
                        {formatMoney(pkg.priceCents)}
                      </div>
                      <div
                        className={`eyebrow mt-6 inline-block border-b pb-1 ${
                          disabled
                            ? "border-transparent text-muted-2"
                            : "border-brown/40 text-brown transition-[letter-spacing] duration-300 group-hover:tracking-[0.42em]"
                        }`}
                      >
                        {disabled ? "Not Enough Left" : "Select"}
                      </div>
                    </button>
                  );
                })}
            </div>

            <p className="eyebrow mt-10 text-muted-2" data-reveal="fade" data-delay="200">
              Pickup only · {drop.pickupDateLabel} · Order by {drop.deadlineLabel}
            </p>
          </>
        )}

        {unavailable && (
          <>
            <p className="mx-auto mt-6 max-w-md leading-relaxed text-muted" data-reveal="fade">
              Join the list and you&apos;ll hear first when the next batch opens.
            </p>
            <WaitlistForm dropId={drop.id} />
          </>
        )}
      </div>
    </section>
  );
}
