import type { LiveDropView } from "./types";
import { PACKAGE_META, PACKAGE_KINDS } from "./types";
import { availLine } from "./avail";
import { deadlineFor, deadlineLabel, longDate, shortDate, windowLabel } from "./format";

/**
 * Phase 1 placeholder: a hardcoded live drop matching the prototype's d5 seed.
 * Phase 3 replaces the body with a Supabase query — same return shape.
 */
export async function getLiveDropView(): Promise<LiveDropView | null> {
  const pickupDate = "2026-10-10";
  const capacity = 60;
  const reserved = 42;
  const remaining = capacity - reserved;
  const isOpen = true;
  const deadline = deadlineFor(pickupDate);

  const packages = PACKAGE_KINDS.map((kind) => {
    const meta = PACKAGE_META[kind];
    return {
      kind,
      title: meta.title,
      name: meta.name,
      sub: meta.sub,
      count: meta.count,
      priceCents: meta.defaultPriceCents,
      available: meta.count <= remaining,
    };
  });

  const smallest = Math.min(...packages.map((p) => p.count));
  const soldOut = remaining < smallest;
  const pastDeadline = Date.now() > deadline.getTime();
  const orderable = isOpen && !soldOut && !pastDeadline;

  return {
    id: "mock-d5",
    cookie: "Brown Butter Chocolate Chunk",
    desc: "Brown Butter • Premium Chocolate • Flaky Sea Salt",
    pickupDateLabel: longDate(pickupDate),
    pickupShort: shortDate(pickupDate),
    deadlineLabel: deadlineLabel(deadline),
    capacity,
    reserved,
    remaining,
    pct: Math.round((reserved / capacity) * 100),
    isOpen,
    soldOut,
    orderable,
    availLine: availLine(reserved, capacity),
    packages,
    windows: [
      { id: "w1", label: windowLabel("09:00", "11:00"), full: false },
      { id: "w2", label: windowLabel("11:00", "13:00"), full: true },
      { id: "w3", label: windowLabel("13:00", "15:00"), full: false },
      { id: "w4", label: windowLabel("15:00", "17:00"), full: false },
    ],
  };
}
