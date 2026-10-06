"use client";

import { useEffect, useState } from "react";
import Crumbs from "./Crumbs";
import MannaMark from "./MannaMark";

const KEY = "manna_intro_v2";

export default function IntroOverlay({
  replayToken = 0,
}: {
  /** bump to replay the intro (footer button) */
  replayToken?: number;
}) {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (replayToken === 0 && sessionStorage.getItem(KEY) === "1") return;
    setShow(true);
    setLeaving(false);
    sessionStorage.setItem(KEY, "1");
    const t1 = window.setTimeout(() => setLeaving(true), 1900);
    const t2 = window.setTimeout(() => setShow(false), 2550);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [replayToken]);

  if (!show) return null;

  return (
    <button
      aria-label="Skip intro"
      onClick={() => setShow(false)}
      className="fixed inset-0 z-[90] flex cursor-pointer items-center justify-center border-0 bg-cream"
      style={leaving ? { animation: "mannaFadeOut .65s cubic-bezier(.2,.7,.2,1) forwards" } : undefined}
    >
      <Crumbs count={18} color="74,38,22" className="pointer-events-none absolute inset-0" />
      <MannaMark size={Math.min(340, typeof window !== "undefined" ? window.innerWidth * 0.72 : 340)} />
    </button>
  );
}
