"use client";

import { useCallback, useState } from "react";
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
  const [replayToken, setReplayToken] = useState(0);
  const [sheetPkg, setSheetPkg] = useState<PackageKind | null>(null);
  const [availSeen, setAvailSeen] = useState(false);

  useReveal(useCallback(() => setAvailSeen(true), []));

  const goOrder = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault?.();
    const o = document.getElementById("order");
    if (o) window.scrollTo({ top: o.getBoundingClientRect().top + window.scrollY - 40, behavior: "smooth" });
  }, []);

  const openSheetFromBar = () => {
    const first = drop.packages.find((p) => p.available);
    if (first) setSheetPkg(first.kind);
  };

  return (
    <div style={{ fontFamily: "var(--font-jost), Jost, sans-serif", color: "#24150D", animation: "mannaFade .6s ease" }}>
      <IntroOverlay replayToken={replayToken} />
      <main>
        <Hero onOrder={goOrder} />
        <CookieSection />
        <MannaStory />
        <OrderSection drop={drop} availSeen={availSeen} onSelect={setSheetPkg} />
        <Testimonials />
      </main>
      <SiteFooter onReplayIntro={() => setReplayToken((t) => t + 1)} onOrder={goOrder} />
      <StickyOrderBar drop={drop} sheetOpen={sheetPkg !== null} onOrder={openSheetFromBar} />
      {sheetPkg !== null && (
        <CheckoutSheet drop={drop} initialPackage={sheetPkg} onClose={() => setSheetPkg(null)} />
      )}
    </div>
  );
}
