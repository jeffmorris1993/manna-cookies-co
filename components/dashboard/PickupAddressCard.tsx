"use client";

import { useState, useTransition } from "react";
import { savePickupAddress } from "@/app/dashboard/actions";
import { useToast } from "./Toast";

export default function PickupAddressCard({ initial }: { initial: string }) {
  const [address, setAddress] = useState(initial);
  const [pending, start] = useTransition();
  const toast = useToast();
  const dirty = address.trim() !== initial.trim();

  return (
    <div style={{ background: "#FBF8F1", borderRadius: 16, padding: "16px 18px" }}>
      <div style={{ fontSize: 11, letterSpacing: ".2em", fontWeight: 500, color: "#6E5546" }}>
        PICKUP ADDRESS
      </div>
      <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.5, color: "#6E5546" }}>
        Sent in every confirmation email and saved into the customer&apos;s calendar invite.
        Leave blank to say &ldquo;we&apos;ll text you the address.&rdquo;
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          maxLength={200}
          placeholder="123 Main St, Grand Rapids, MI"
          style={{
            flex: "1 1 240px",
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
        <button
          disabled={pending || !dirty}
          onClick={() =>
            start(async () => {
              const res = await savePickupAddress(address);
              toast(res.ok ? "Pickup address saved" : (res.error ?? "Couldn't save"));
            })
          }
          className="cursor-pointer border-0 disabled:opacity-50"
          style={{
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
          {pending ? "SAVING…" : "SAVE"}
        </button>
      </div>
    </div>
  );
}
