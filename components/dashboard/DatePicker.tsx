"use client";

import { useEffect, useRef, useState } from "react";

/** ISO date helpers (all timezone-free, calendar math only) */
const toISO = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const parse = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m: m - 1, d };
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["S", "M", "T", "W", "T", "F", "S"];

/** Branded calendar popover: cream card, Playfair month, ink selection. */
export default function DatePicker({
  value,
  min,
  disabled,
  onChange,
}: {
  value: string; // ISO
  min?: string; // ISO — days before this are not selectable
  disabled?: boolean;
  onChange: (iso: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const sel = parse(value);
  const [view, setView] = useState({ y: sel.y, m: sel.m });
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = new Date(Date.UTC(sel.y, sel.m, sel.d, 12)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  const firstDow = new Date(Date.UTC(view.y, view.m, 1, 12)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0, 12)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // can't navigate before the month containing the minimum date
  const prevDisabled = !!min && `${view.y}-${String(view.m + 1).padStart(2, "0")}` <= min.slice(0, 7);

  return (
    <div ref={rootRef} style={{ position: "relative", flex: "1 1 170px", minWidth: 0 }}>
      <button
        disabled={disabled}
        onClick={() => {
          setView({ y: sel.y, m: sel.m });
          setOpen(!open);
        }}
        className="cursor-pointer disabled:opacity-60"
        style={{
          width: "100%",
          height: 44,
          border: "1px solid rgba(74,38,22,.25)",
          borderRadius: 10,
          background: "#FFFFFF",
          padding: "0 12px",
          fontSize: 15,
          color: "#24150D",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span style={{ fontWeight: 500 }}>{label}</span>
        <span aria-hidden style={{ fontSize: 11, color: "#8A6440", letterSpacing: ".1em" }}>▾</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose a date"
          style={{
            position: "absolute",
            zIndex: 40,
            top: 50,
            left: 0,
            width: 280,
            maxWidth: "88vw",
            background: "#FBF8F1",
            border: "1px solid rgba(74,38,22,.2)",
            borderRadius: 14,
            padding: 14,
            boxShadow: "0 18px 40px -18px rgba(36,21,13,.45)",
            animation: "mannaIn .2s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              aria-label="Previous month"
              disabled={prevDisabled}
              onClick={() => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }))}
              className="cursor-pointer disabled:opacity-30"
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                border: "1px solid rgba(74,38,22,.2)",
                background: "#FFFFFF",
                color: "#4A2616",
                fontSize: 14,
              }}
            >
              ‹
            </button>
            <div className="font-display" style={{ fontSize: 17 }}>
              {MONTHS[view.m]} {view.y}
            </div>
            <button
              aria-label="Next month"
              onClick={() => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }))}
              className="cursor-pointer"
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                border: "1px solid rgba(74,38,22,.2)",
                background: "#FFFFFF",
                color: "#4A2616",
                fontSize: 14,
              }}
            >
              ›
            </button>
          </div>

          <div
            style={{
              marginTop: 10,
              display: "grid",
              gridTemplateColumns: "repeat(7,1fr)",
              gap: 2,
              textAlign: "center",
            }}
          >
            {DOW.map((d, i) => (
              <div
                key={i}
                style={{ fontSize: 9, letterSpacing: ".14em", fontWeight: 600, color: "#8A6440", padding: "4px 0" }}
              >
                {d}
              </div>
            ))}
            {cells.map((d, i) => {
              if (d === null) return <div key={`e${i}`} />;
              const iso = toISO(view.y, view.m, d);
              const isSel = iso === value;
              const isDisabled = !!min && iso < min;
              return (
                <button
                  key={iso}
                  disabled={isDisabled}
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                  className={isDisabled ? "cursor-not-allowed" : "cursor-pointer"}
                  style={{
                    height: 32,
                    borderRadius: "50%",
                    border: 0,
                    background: isSel ? "#24150D" : "transparent",
                    color: isDisabled ? "rgba(110,85,70,.35)" : isSel ? "#F5EFE4" : "#24150D",
                    fontSize: 13,
                    fontWeight: isSel ? 600 : 400,
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {min && (
            <div style={{ marginTop: 10, fontSize: 10.5, lineHeight: 1.5, color: "#8A7466" }}>
              Earlier days are unavailable — ordering would already be closed under the current
              deadline.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
