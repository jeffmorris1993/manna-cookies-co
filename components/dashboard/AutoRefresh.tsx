"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Keeps dashboard data live: re-fetches server components every `intervalMs`
 * while the tab is visible, and immediately when the owner returns to it.
 */
export default function AutoRefresh({ intervalMs = 25_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = window.setInterval(refresh, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [router, intervalMs]);

  return null;
}
