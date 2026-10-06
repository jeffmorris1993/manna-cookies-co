"use client";

import { useState } from "react";
import type { LiveDropView, PackageKind } from "@/lib/types";
import { useReveal } from "./useReveal";
import IntroOverlay from "./IntroOverlay";
import Hero from "./Hero";
import CookieSection from "./CookieSection";
import MannaStory from "./MannaStory";
import OrderSection from "./OrderSection";
import Testimonials from "./Testimonials";
import SiteFooter from "./SiteFooter";
import StickyOrderBar from "./StickyOrderBar";
import CheckoutSheet from "@/components/checkout/CheckoutSheet";

export default function PublicSite({ drop }: { drop: LiveDropView }) {
  useReveal();
  const [replayToken, setReplayToken] = useState(0);
  const [sheetPkg, setSheetPkg] = useState<PackageKind | null>(null);

  const openSheet = (kind: PackageKind) => setSheetPkg(kind);
  const openSheetFromBar = () => {
    const first = drop.packages.find((p) => p.available);
    if (first) setSheetPkg(first.kind);
  };

  return (
    <>
      <IntroOverlay replayToken={replayToken} />
      <main>
        <Hero />
        <CookieSection />
        <MannaStory />
        <OrderSection drop={drop} onSelect={openSheet} />
        <Testimonials />
      </main>
      <SiteFooter onReplayIntro={() => setReplayToken((t) => t + 1)} />
      <StickyOrderBar drop={drop} sheetOpen={sheetPkg !== null} onOrder={openSheetFromBar} />
      {sheetPkg !== null && (
        <CheckoutSheet drop={drop} initialPackage={sheetPkg} onClose={() => setSheetPkg(null)} />
      )}
    </>
  );
}
