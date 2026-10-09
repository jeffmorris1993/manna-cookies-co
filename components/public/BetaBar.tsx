"use client";

import { useNarrow } from "@/lib/useNarrow";

/**
 * Pre-launch warning strip. Live Square payments are on, so until launch this
 * warns visitors that ordering charges real cards. Delete the component from
 * PublicSite (or make it return null) at launch.
 */
export default function BetaBar() {
  const narrow = useNarrow(700);
  return (
    <div
      role="status"
      style={{
        minHeight: 34,
        background: "#8A3B1E",
        color: "#F5EFE4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 14px",
        textAlign: "center",
      }}
    >
      <span style={{ fontSize: 10, letterSpacing: ".18em", fontWeight: 600, whiteSpace: "nowrap" }}>
        {narrow
          ? "BETA · REAL CARDS ARE CHARGED — PLEASE DON'T ORDER YET"
          : "BETA PREVIEW · LIVE PAYMENTS ARE ON — REAL CARDS WILL BE CHARGED · PLEASE DON'T ORDER YET"}
      </span>
    </div>
  );
}
