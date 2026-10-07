"use client";

import type { LiveDropView } from "@/lib/types";

/**
 * Slim branded strip above the hero: last-call / almost-gone urgency.
 * Echoes the prototype's dark top strip (#140B06).
 */
export default function AnnouncementBar({ drop }: { drop: LiveDropView }) {
  if (!drop.orderable) return null;

  const hoursLeft = (new Date(drop.deadlineAt).getTime() - Date.now()) / 3_600_000;
  const nearSellout = drop.remaining <= 18;
  const lastCall = hoursLeft > 0 && hoursLeft <= 24;
  if (!nearSellout && !lastCall) return null;

  const text = nearSellout
    ? `ALMOST GONE · ONLY ${drop.remaining} COOKIES LEFT THIS WEEK`
    : `LAST CALL · ORDERING CLOSES ${drop.deadlineLabel.toUpperCase()}`;

  return (
    <div
      role="status"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 60,
        height: 40,
        background: "#140B06",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 14px",
        animation: "mannaFade .5s ease",
      }}
    >
      <span
        style={{
          fontSize: 10.5,
          letterSpacing: ".22em",
          fontWeight: 500,
          color: "#E3CBA8",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {text}
      </span>
    </div>
  );
}
