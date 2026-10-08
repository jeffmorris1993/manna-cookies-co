"use client";

import { useEffect, useState } from "react";

/** True below maxWidth. JS matchMedia (not CSS) so inline-styled layouts can branch. */
export function useNarrow(maxWidth = 560) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [maxWidth]);
  return narrow;
}
