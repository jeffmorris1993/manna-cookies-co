"use client";

import type { LiveDropView } from "@/lib/types";
import { useNarrow } from "@/lib/useNarrow";

/**
 * Slim branded strip above the hero: last-call / almost-gone urgency.
 * Full copy on wide screens; condensed copy on phones so nothing truncates.
 */
export default function AnnouncementBar({ drop }: { drop: LiveDropView }) {
  const narrow = useNarrow();
  if (!drop.orderable) return null;

  const deadline = new Date(drop.deadlineAt);
  const hoursLeft = (deadline.getTime() - Date.now()) / 3_600_000;
  const nearSellout = drop.remaining <= 18;
  const lastCall = hoursLeft > 0 && hoursLeft <= 24;
  if (!nearSellout && !lastCall) return null;

  const shortDeadline = `${deadline
    .toLocaleDateString("en-US", { weekday: "short", timeZone: "America/New_York" })
    .toUpperCase()} ${deadline.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  })}`;

  const full = nearSellout
    ? `ALMOST GONE · ONLY ${drop.remaining} COOKIES LEFT THIS WEEK`
    : drop.nextPickupShort
      ? `LAST CALL · ${drop.nextPickupShort} PICKUP CLOSES ${shortDeadline.toUpperCase()}`
      : `LAST CALL · ORDERING CLOSES ${drop.deadlineLabel.toUpperCase()}`;
  const short = nearSellout
    ? `ONLY ${drop.remaining} COOKIES LEFT`
    : drop.nextPickupShort
      ? `${drop.nextPickupShort} PICKUP CLOSES ${shortDeadline.toUpperCase()}`
      : `LAST CALL · CLOSES ${shortDeadline.toUpperCase()}`;

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
          fontSize: narrow ? 10 : 10.5,
          letterSpacing: narrow ? ".18em" : ".22em",
          fontWeight: 500,
          color: "#E3CBA8",
          whiteSpace: "nowrap",
        }}
      >
        {narrow ? short : full}
      </span>
    </div>
  );
}
