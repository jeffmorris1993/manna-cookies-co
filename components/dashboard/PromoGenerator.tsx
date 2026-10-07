"use client";

import { useState } from "react";

const PROMOS = [
  [
    "INSTAGRAM CAPTION",
    "This week's manna is here. Brown butter, generous chocolate and a pinch of flaky sea salt. Limited batch for Saturday pickup. Link in bio to reserve yours.",
  ],
  [
    "FACEBOOK POST",
    "Saturday's batch of Brown Butter Chocolate Chunk cookies is open. 3-packs, half dozens and dozens are available until Thursday at 8 PM, or until they're gone.",
  ],
  [
    "SMS ANNOUNCEMENT",
    "Manna Cookies: this week's batch is open. Reserve for Saturday pickup before Thursday 8 PM.",
  ],
  [
    "EMAIL ANNOUNCEMENT",
    "Subject: This week's manna is ready to reserve. One cookie, made really well. Reserve your box for Saturday pickup.",
  ],
] as const;

export default function PromoGenerator() {
  const [on, setOn] = useState(false);

  return (
    <>
      <button
        onClick={() => setOn(true)}
        className="cursor-pointer border-0"
        style={{
          marginTop: 16,
          width: "100%",
          height: 54,
          borderRadius: 12,
          background: "#F5EFE4",
          color: "#24150D",
          fontSize: 12,
          letterSpacing: ".18em",
          fontWeight: 600,
        }}
      >
        {on ? "REGENERATE" : "GENERATE THIS WEEK'S PROMO"}
      </button>
      {on && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          {PROMOS.map(([ch, t], i) => (
            <div
              key={ch}
              style={{
                background: "#F5EFE4",
                color: "#24150D",
                borderRadius: 12,
                padding: 14,
                animation: "mannaIn .5s ease both",
                animationDelay: `${i * 0.12}s`,
              }}
            >
              <div style={{ fontSize: 10, letterSpacing: ".2em", fontWeight: 600, color: "#8A6440" }}>
                {ch}
              </div>
              <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.5 }}>{t}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
