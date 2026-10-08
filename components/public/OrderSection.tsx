"use client";

import Image from "next/image";
import type { LiveDropView, PackageKind } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import WaitlistForm from "./WaitlistForm";

const EYEBROW: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: ".42em",
  fontWeight: 500,
  color: "#8A6440",
};

function Desc({ text, align }: { text: string; align: "center" | "left" }) {
  if (text.includes("•")) {
    return (
      <div
        data-reveal="up"
        data-delay="180"
        style={{ marginTop: 10, fontSize: 13, letterSpacing: ".2em", lineHeight: 1.6, color: "#5A4334" }}
      >
        {text.split("•").map((part, i, arr) => (
          <span key={i}>
            <span style={part.trim().length <= 32 ? { whiteSpace: "nowrap" } : undefined}>
              {part.trim()}
            </span>
            {i < arr.length - 1 && <span> • </span>}
          </span>
        ))}
      </div>
    );
  }
  return (
    <div
      data-reveal="up"
      data-delay="180"
      style={{
        margin: align === "center" ? "12px auto 0" : "12px 0 0",
        maxWidth: 440,
        fontSize: 14,
        letterSpacing: ".08em",
        lineHeight: 1.7,
        color: "#5A4334",
        whiteSpace: "pre-line",
        textWrap: "pretty",
      }}
    >
      {text}
    </div>
  );
}

function AvailBar({
  drop,
  availSeen,
  align,
}: {
  drop: LiveDropView;
  availSeen: boolean;
  align: "center" | "left";
}) {
  return (
    <div
      data-reveal="up"
      data-delay="240"
      style={{ maxWidth: 520, margin: align === "center" ? "40px auto 0" : "36px 0 0" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          fontSize: 11,
          letterSpacing: ".2em",
          fontWeight: 500,
        }}
      >
        <span>{drop.availLine}</span>
        <span style={{ color: "#8A6440" }}>{drop.pickupShort}</span>
      </div>
      <div style={{ marginTop: 12, height: 3, background: "rgba(74,38,22,.14)", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${availSeen ? drop.pct : 0}%`,
            background: "#4A2616",
            transition: "width 1.8s cubic-bezier(.2,.7,.2,1)",
          }}
        />
      </div>
    </div>
  );
}

export default function OrderSection({
  drop,
  availSeen,
  onSelect,
}: {
  drop: LiveDropView;
  availSeen: boolean;
  onSelect: (kind: PackageKind) => void;
}) {
  const unavailable = !drop.orderable;
  const unavailTitle = drop.soldOut
    ? "THIS WEEK'S MANNA IS GONE."
    : "ORDERS ARE CLOSED FOR THIS WEEK.";
  // Closed (not sold out): the closed card IS the section. Sold out keeps the
  // showcase — a full bar over the waitlist is social proof.
  const showShowcase = !unavailable || drop.soldOut;
  // Design's "side by side" layout whenever the drop has a photo.
  const split = showShowcase && !!drop.photoUrl;

  return (
    <section id="order" data-screen-label="Order" style={{ background: "#FBF8F1" }}>
      <div
        style={{
          height: 34,
          background: "repeating-linear-gradient(90deg,#4A2616 0 26px,#FBF8F1 26px 52px)",
        }}
      />
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "clamp(80px,10vw,140px) clamp(20px,5vw,64px)",
          textAlign: "center",
        }}
      >
        {!showShowcase && <div data-reveal="fade" style={EYEBROW}>ORDER FOR PICKUP</div>}

        {split && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))",
              gap: "clamp(32px,5vw,72px)",
              alignItems: "center",
              textAlign: "left",
            }}
          >
            <div
              data-reveal="scale"
              style={{ aspectRatio: "4/5", overflow: "hidden", maxHeight: 620, position: "relative" }}
            >
              <Image
                src={drop.photoUrl!}
                alt={`This week's cookie — ${drop.cookie}`}
                fill
                sizes="(max-width: 800px) 92vw, 560px"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div>
              <div data-reveal="fade" style={EYEBROW}>
                ORDER FOR PICKUP
              </div>
              <h2
                className="font-display"
                style={{
                  margin: "20px 0 0",
                  fontWeight: 500,
                  fontSize: "clamp(38px,5.4vw,72px)",
                  lineHeight: 1,
                  letterSpacing: ".02em",
                }}
              >
                <span style={{ display: "block", overflow: "hidden", paddingBottom: ".06em" }}>
                  <span data-reveal="mask" style={{ display: "block" }}>
                    THIS WEEK&apos;S MANNA
                  </span>
                </span>
              </h2>
              <div
                data-reveal="fade"
                data-delay="120"
                style={{ marginTop: 28, width: 40, height: 1, background: "#4A2616" }}
              />
              <div
                data-reveal="up"
                data-delay="120"
                className="font-display italic"
                style={{ marginTop: 24, fontSize: "clamp(22px,3vw,30px)" }}
              >
                {drop.cookie}
              </div>
              <Desc text={drop.desc} align="left" />
              <AvailBar drop={drop} availSeen={availSeen} align="left" />

              {!unavailable && (
                <div
                  style={{ marginTop: 32, maxWidth: 520, display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {drop.packages.map((pkg) => {
                    const disabled = !pkg.available;
                    return (
                      <button
                        key={pkg.kind}
                        disabled={disabled}
                        onClick={() => !disabled && onSelect(pkg.kind)}
                        className={
                          disabled
                            ? "cursor-not-allowed"
                            : "cursor-pointer transition-colors duration-300 hover:border-[#24150D]"
                        }
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                          minHeight: 68,
                          padding: "0 18px",
                          border: "1px solid rgba(74,38,22,.3)",
                          background: "#FFFFFF",
                          color: "#24150D",
                          opacity: disabled ? 0.45 : 1,
                          textAlign: "left",
                        }}
                      >
                        <span>
                          <span style={{ display: "block", fontSize: 12, letterSpacing: ".16em", fontWeight: 600 }}>
                            {pkg.title}
                          </span>
                          <span style={{ display: "block", fontSize: 13, color: "#5A4334", marginTop: 3 }}>
                            {pkg.sub}
                            {disabled ? " · NOT ENOUGH LEFT" : ""}
                          </span>
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 14, flex: "0 0 auto" }}>
                          <span className="font-display" style={{ fontSize: 24 }}>
                            {formatMoney(pkg.priceCents)}
                          </span>
                          {!disabled && (
                            <span
                              style={{
                                fontSize: 10,
                                letterSpacing: ".22em",
                                fontWeight: 600,
                                borderBottom: "1px solid #4A2616",
                                paddingBottom: 3,
                              }}
                            >
                              SELECT
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                  <div style={{ marginTop: 10, fontSize: 13, color: "#5A4334" }}>
                    Pickup only · {drop.pickupDateLabel} · Order by {drop.deadlineLabel}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {showShowcase && !split && (
          <>
            <div data-reveal="fade" style={EYEBROW}>
              ORDER FOR PICKUP
            </div>
            <h2
              className="font-display"
              style={{
                margin: "20px 0 0",
                fontWeight: 500,
                fontSize: "clamp(40px,7vw,88px)",
                lineHeight: 1,
                letterSpacing: ".02em",
              }}
            >
              <span style={{ display: "block", overflow: "hidden", paddingBottom: ".06em" }}>
                <span data-reveal="mask" style={{ display: "block" }}>
                  THIS WEEK&apos;S MANNA
                </span>
              </span>
            </h2>
            <div
              data-reveal="up"
              data-delay="120"
              className="font-display italic"
              style={{ marginTop: 22, fontSize: "clamp(22px,3vw,30px)" }}
            >
              {drop.cookie}
            </div>
            <Desc text={drop.desc} align="center" />
            <AvailBar drop={drop} availSeen={availSeen} align="center" />
          </>
        )}

        {!unavailable && !split && (
          <>
            <div
              style={{
                // flex (not grid): cards share a row when they fit, and any
                // wrapped card is CENTERED instead of stranded on the left
                marginTop: 56,
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "clamp(16px,2vw,28px)",
                textAlign: "center",
              }}
            >
              {drop.packages.map((pkg, i) => {
                const disabled = !pkg.available;
                return (
                  <button
                    key={pkg.kind}
                    data-reveal="up"
                    data-delay={String(i * 110)}
                    disabled={disabled}
                    onClick={() => !disabled && onSelect(pkg.kind)}
                    className={
                      disabled
                        ? "cursor-not-allowed"
                        : "cursor-pointer transition-[box-shadow,translate] duration-[.4s] hover:-translate-y-1 hover:shadow-card-hover"
                    }
                    style={{
                      flex: "0 1 320px",
                      minWidth: "min(100%, 240px)",
                      border: "1px solid #4A2616",
                      background: "#F5EFE4",
                      padding: 9,
                      color: "#24150D",
                      opacity: disabled ? 0.45 : 1,
                    }}
                  >
                    <div
                      style={{
                        border: "1px solid rgba(74,38,22,.35)",
                        borderRadius: "50% 50% 0 0 / 90px 90px 0 0",
                        padding: "44px 18px 28px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div className="font-display" style={{ fontSize: 76, lineHeight: 0.9, fontWeight: 500 }}>
                        {pkg.count}
                      </div>
                      <div style={{ fontSize: 11, letterSpacing: ".3em", color: "#8A6440" }}>COOKIES</div>
                      <div
                        className="font-display"
                        style={{
                          marginTop: 14,
                          fontSize: 17,
                          letterSpacing: ".18em",
                          lineHeight: 1.35,
                          minHeight: 46,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {pkg.title}
                      </div>
                      <div style={{ width: 32, height: 1, background: "#4A2616", margin: "6px 0" }} />
                      <div className="font-display" style={{ fontSize: 34 }}>
                        {formatMoney(pkg.priceCents)}
                      </div>
                      <div
                        style={{
                          marginTop: 10,
                          fontSize: 11,
                          letterSpacing: ".24em",
                          fontWeight: 500,
                          borderBottom: "1px solid #4A2616",
                          paddingBottom: 4,
                        }}
                      >
                        {disabled ? "NOT ENOUGH LEFT" : "SELECT"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 32, fontSize: 14, color: "#5A4334" }}>
              Pickup only · {drop.pickupDateLabel} · Order by {drop.deadlineLabel}
            </div>
          </>
        )}

        {unavailable && (
          <div style={{ margin: "56px auto 0", maxWidth: 560, border: "1px solid #4A2616", padding: 9 }}>
            <div style={{ border: "1px solid rgba(74,38,22,.35)", padding: "48px clamp(20px,5vw,48px)" }}>
              <div className="font-display" style={{ fontSize: "clamp(28px,4vw,40px)", lineHeight: 1.1 }}>
                {unavailTitle}
              </div>
              <p style={{ margin: "16px auto 0", maxWidth: 380, color: "#5A4334", lineHeight: 1.6 }}>
                Join the list and you&apos;ll hear first when the next batch opens.
              </p>
              <WaitlistForm dropId={drop.id} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
