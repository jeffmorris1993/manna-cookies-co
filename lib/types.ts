export type PackageKind = "three" | "half" | "dozen";

export const PACKAGE_META: Record<
  PackageKind,
  { title: string; name: string; sub: string; count: number; defaultPriceCents: number }
> = {
  three: { title: "3-PACK", name: "3-Pack", sub: "3 Cookies", count: 3, defaultPriceCents: 1400 },
  half: {
    title: "THE MANNA HALF DOZEN",
    name: "The Manna Half Dozen",
    sub: "6 Cookies",
    count: 6,
    defaultPriceCents: 2800,
  },
  dozen: {
    title: "THE MANNA DOZEN",
    name: "The Manna Dozen",
    sub: "12 Cookies",
    count: 12,
    defaultPriceCents: 5200,
  },
};

export const PACKAGE_KINDS: PackageKind[] = ["three", "half", "dozen"];

export type OrderStatus = "pending" | "new" | "preparing" | "ready" | "picked" | "canceled";
export type DropStatus = "scheduled" | "live" | "complete";

/** Serializable view of the live drop, shared by the public page and checkout. */
export interface PublicPackage {
  kind: PackageKind;
  title: string;
  name: string;
  sub: string;
  count: number;
  priceCents: number;
  /** enabled for this drop AND enough cookies remain */
  available: boolean;
}

export interface PublicWindow {
  id: string;
  label: string;
  full: boolean;
  closed: boolean; // this day's ordering deadline has passed
  orderByLabel: string; // this day's cutoff, "Sunday, Oct 11 · 8:00 PM"
  starts: string; // "09:00"
  ends: string; // "11:00"
  dateISO: string; // "2026-10-11" — windows can span multiple days
  dateLabel: string; // "Saturday, Oct 11"
}

export interface LiveDropView {
  id: string;
  cookie: string;
  desc: string;
  photoUrl: string | null;
  pickupDateISO: string; // "2026-10-10"
  pickupDateLabel: string; // "Saturday, Oct 10"
  pickupShort: string; // "SAT, OCT 10"
  deadlineLabel: string; // next upcoming cutoff, "Thursday, Oct 8 · 8:00 PM"
  deadlineRule: string; // customer-facing rule line, e.g. "Order by 8:00 PM, 2 days before your pickup day"
  deadlineAt: string; // ISO timestamp of the next cutoff, for countdown logic
  nextPickupShort: string | null; // multi-day only: the day that cutoff is for, "OCT 12"
  capacity: number;
  reserved: number;
  remaining: number;
  /** percent of capacity reserved, 0-100 */
  pct: number;
  isOpen: boolean;
  soldOut: boolean;
  /** open, not past deadline, and at least one package still fits */
  orderable: boolean;
  availLine: string;
  packages: PublicPackage[];
  windows: PublicWindow[];
}
