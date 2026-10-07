"use client";

import { useEffect, useState } from "react";
import Crumbs from "./Crumbs";
import MannaMark from "./MannaMark";

const KEY = "manna_intro_v2";

function markSeen() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {}
}

export default function IntroOverlay({ replayToken = 0 }: { replayToken?: number }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
    } catch {}
    if (replayToken === 0 && seen) return;
    if (replayToken > 0) window.scrollTo(0, 0);
    setShow(true);
    // marked seen when the intro ends (not on mount) so StrictMode's
    // double-effect in dev can't strand the overlay
    const t = window.setTimeout(() => {
      markSeen();
      setShow(false);
    }, 2550);
    return () => window.clearTimeout(t);
  }, [replayToken]);

  if (!show) return null;

  return (
    <div
      onClick={() => {
        markSeen();
        setShow(false);
      }}
      role="button"
      aria-label="Skip intro"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "#F5EFE4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        animation: "mannaFadeOut .6s ease 1.9s forwards",
      }}
    >
      <Crumbs
        n={18}
        once
        top
        color="74,38,22"
        speed={3.2}
        alpha={0.9}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      <MannaMark />
    </div>
  );
}
