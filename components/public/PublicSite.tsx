"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LiveDropView, PackageKind } from "@/lib/types";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useReveal } from "./useReveal";
import IntroOverlay from "./IntroOverlay";
import AnnouncementBar from "./AnnouncementBar";
import BetaBar from "./BetaBar";
import Hero from "./Hero";
import CookieSection from "./CookieSection";
import MannaStory from "./MannaStory";
import OrderSection from "./OrderSection";
import Testimonials from "./Testimonials";
import FollowSection from "./FollowSection";
import SiteFooter from "./SiteFooter";
import StickyOrderBar from "./StickyOrderBar";
import CheckoutSheet from "@/components/checkout/CheckoutSheet";

const POLL_MS = 15_000;

export default function PublicSite({ drop: initialDrop }: { drop: LiveDropView }) {
  const [drop, setDrop] = useState(initialDrop);
  const [sheetPkg, setSheetPkg] = useState<PackageKind | null>(null);
  const [availSeen, setAvailSeen] = useState(false);
  const sheetOpenRef = useRef(false);
  sheetOpenRef.current = sheetPkg !== null;

  useReveal(useCallback(() => setAvailSeen(true), []));

  // Keep availability live: poll while visible, refresh on return to the tab.
  useEffect(() => {
    let stopped = false;
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      if (sheetOpenRef.current) return; // the sheet manages its own snapshot
      try {
        const res = await fetch("/api/drop");
        if (!res.ok) return;
        const body = (await res.json()) as { drop: LiveDropView | null };
        if (stopped) return;
        if (body.drop === null) {
          window.location.reload(); // drop ended entirely → closed page
          return;
        }
        setDrop(body.drop);
      } catch {
        /* transient — next tick retries */
      }
    };
    const id = window.setInterval(refresh, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    // Event-driven: the server broadcasts after every dashboard save or order,
    // so open tabs update within a second instead of waiting for the poll.
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel("drop-updates", { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "changed" }, () => {
        window.dispatchEvent(new Event("manna:drop-changed")); // checkout sheet listens
        refresh();
      })
      .subscribe();

    return () => {
      stopped = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      supabase.removeChannel(channel);
    };
  }, []);

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
      <IntroOverlay />
      <BetaBar />
      <AnnouncementBar drop={drop} />
      <main>
        <Hero onOrder={goOrder} />
        <CookieSection />
        <MannaStory />
        <OrderSection drop={drop} availSeen={availSeen} onSelect={setSheetPkg} />
        <Testimonials />
        <FollowSection />
      </main>
      <SiteFooter onOrder={goOrder} />
      <StickyOrderBar drop={drop} sheetOpen={sheetPkg !== null} onOrder={openSheetFromBar} />
      {sheetPkg !== null && (
        <CheckoutSheet drop={drop} initialPackage={sheetPkg} onClose={() => setSheetPkg(null)} />
      )}
    </div>
  );
}
