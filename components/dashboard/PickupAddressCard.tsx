"use client";

import { useState, useTransition } from "react";
import { saveOrderSettings } from "@/app/dashboard/actions";
import { useToast } from "./Toast";

export default function OrderSettingsCard({
  initialAddress,
  initialDeadlineDays,
}: {
  initialAddress: string;
  initialDeadlineDays: number;
}) {
  const [address, setAddress] = useState(initialAddress);
  const [days, setDays] = useState(initialDeadlineDays);
  const [pending, start] = useTransition();
  const toast = useToast();
  const dirty = address.trim() !== initialAddress.trim() || days !== initialDeadlineDays;

  return (
    <div style={{ background: "#FBF8F1", borderRadius: 16, padding: "16px 18px" }}>
      <div style={{ fontSize: 11, letterSpacing: ".2em", fontWeight: 500, color: "#6E5546" }}>
        ORDER SETTINGS
      </div>

      <div style={{ marginTop: 12, fontSize: 13, color: "#6E5546" }}>
        Pickup address — sent in confirmation emails and calendar invites.
      </div>
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        maxLength={200}
        placeholder="123 Main St, Grand Rapids, MI"
        style={{
          marginTop: 8,
          width: "100%",
          height: 48,
          border: "1px solid rgba(74,38,22,.2)",
          borderRadius: 10,
          background: "#FFFFFF",
          padding: "0 12px",
          fontSize: 15,
          color: "#24150D",
          outline: "none",
        }}
      />

      <div
        style={{
          marginTop: 14,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px 12px",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Default ordering deadline</div>
          <div style={{ fontSize: 12, color: "#6E5546", marginTop: 2 }}>
            {days === 0 ? "Day of pickup" : `${days} day${days === 1 ? "" : "s"} before pickup`} ·
            8:00 PM · applies to new drops
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            disabled={pending || days <= 0}
            onClick={() => setDays(days - 1)}
            aria-label="Fewer days"
            className="cursor-pointer disabled:opacity-40"
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: "1px solid rgba(74,38,22,.25)",
              background: "#FFFFFF",
              fontSize: 18,
              color: "#24150D",
            }}
          >
            −
          </button>
          <span className="font-display" style={{ minWidth: 40, textAlign: "center", fontSize: 22 }}>
            {days}
          </span>
          <button
            disabled={pending || days >= 7}
            onClick={() => setDays(days + 1)}
            aria-label="More days"
            className="cursor-pointer disabled:opacity-40"
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: "1px solid rgba(74,38,22,.25)",
              background: "#FFFFFF",
              fontSize: 18,
              color: "#24150D",
            }}
          >
            +
          </button>
        </div>
      </div>

      <button
        disabled={pending || !dirty}
        onClick={() =>
          start(async () => {
            const res = await saveOrderSettings(address, days);
            toast(res.ok ? "Settings saved" : (res.error ?? "Couldn't save"));
          })
        }
        className="cursor-pointer border-0 disabled:opacity-50"
        style={{
          marginTop: 14,
          height: 48,
          padding: "0 22px",
          borderRadius: 12,
          background: "#24150D",
          color: "#F5EFE4",
          fontSize: 12,
          letterSpacing: ".16em",
          fontWeight: 600,
        }}
      >
        {pending ? "SAVING…" : "SAVE SETTINGS"}
      </button>
    </div>
  );
}
