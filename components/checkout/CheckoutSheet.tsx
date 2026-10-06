"use client";

// Placeholder shell — the full 5-step checkout lands in Phase 4 (Square payments).
import type { LiveDropView, PackageKind } from "@/lib/types";

export default function CheckoutSheet({
  drop,
  initialPackage,
  onClose,
}: {
  drop: LiveDropView;
  initialPackage: PackageKind;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal>
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink-deepest/60" />
      <div
        className="relative w-full max-w-[540px] rounded-t-[22px] bg-cream-raised p-8 text-center"
        style={{ animation: "mannaSheet .45s cubic-bezier(.2,.7,.2,1) both", maxHeight: "92svh" }}
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-brown/20" />
        <p className="mt-8 font-display text-xl italic text-brown">{drop.cookie}</p>
        <p className="eyebrow mt-3 text-muted-2">Checkout coming in Phase 4 · {initialPackage}</p>
        <button
          onClick={onClose}
          className="eyebrow mt-8 w-full bg-ink px-6 py-4 text-cream"
        >
          Close
        </button>
      </div>
    </div>
  );
}
