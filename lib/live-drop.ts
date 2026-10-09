import "server-only";
import type { LiveDropView, PackageKind } from "./types";
import { PACKAGE_META } from "./types";
import { availLine } from "./avail";
import { deadlineLabel, longDate, monthDay, windowLabel } from "./format";
import { supabaseAdmin } from "./supabase/admin";

const COUNTED_STATUSES = ["new", "preparing", "ready", "picked"] as const;
const PENDING_TTL_MS = 15 * 60 * 1000;

/** Cookies reserved for a drop: confirmed orders + fresh (non-stale) pending holds. */
export async function reservedCount(dropId: string): Promise<number> {
  const db = supabaseAdmin();
  const freshCutoff = new Date(Date.now() - PENDING_TTL_MS).toISOString();
  const { data, error } = await db
    .from("orders")
    .select("cookie_count, status, created_at")
    .eq("drop_id", dropId)
    .or(
      `status.in.(${COUNTED_STATUSES.join(",")}),and(status.eq.pending,created_at.gt.${freshCutoff})`,
    );
  if (error) throw new Error(`reservedCount: ${error.message}`);
  return (data ?? []).reduce((sum, r) => sum + r.cookie_count, 0);
}

/** The live drop as the public site sees it. Null when no drop is live. */
export async function getLiveDropView(): Promise<LiveDropView | null> {
  const db = supabaseAdmin();

  const { data: drop, error } = await db
    .from("drops")
    .select("id, cookie, description, photo_url, pickup_date, deadline, capacity, is_open")
    .eq("status", "live")
    .maybeSingle();
  if (error) throw new Error(`getLiveDropView drops: ${error.message}`);
  if (!drop) return null;

  const [{ data: pkgRows, error: pkgErr }, { data: winRows, error: winErr }, reserved] =
    await Promise.all([
      db
        .from("drop_packages")
        .select("kind, enabled, price_cents")
        .eq("drop_id", drop.id)
        .eq("enabled", true),
      db
        .from("pickup_windows")
        .select("id, starts, ends, is_full, sort, pickup_date")
        .eq("drop_id", drop.id)
        .order("pickup_date")
        .order("starts"),
      reservedCount(drop.id),
    ]);
  if (pkgErr) throw new Error(`getLiveDropView packages: ${pkgErr.message}`);
  if (winErr) throw new Error(`getLiveDropView windows: ${winErr.message}`);

  const remaining = Math.max(0, drop.capacity - reserved);

  const kindOrder: PackageKind[] = ["three", "half", "dozen"];
  const packages = (pkgRows ?? [])
    .sort((a, b) => kindOrder.indexOf(a.kind) - kindOrder.indexOf(b.kind))
    .map((p) => {
      const meta = PACKAGE_META[p.kind as PackageKind];
      return {
        kind: p.kind as PackageKind,
        title: meta.title,
        name: meta.name,
        sub: meta.sub,
        count: meta.count,
        priceCents: p.price_cents,
        available: meta.count <= remaining,
      };
    });

  const smallest = packages.length ? Math.min(...packages.map((p) => p.count)) : Infinity;
  const soldOut = remaining < smallest;
  const deadline = new Date(drop.deadline);
  const pastDeadline = Date.now() > deadline.getTime();
  const orderable = drop.is_open && !soldOut && !pastDeadline;

  // pickup can span multiple days — derive labels from the windows themselves
  const dates = [...new Set((winRows ?? []).map((w) => w.pickup_date as string))].sort();
  const multiDay = dates.length > 1;
  // keep the label short even for many days: "Monday, Oct 12 – Thursday, Oct 15"
  const pickupDateLabel = multiDay
    ? dates.length === 2
      ? `${longDate(dates[0]!)} & ${longDate(dates[1]!)}`
      : `${longDate(dates[0]!)} – ${longDate(dates[dates.length - 1]!)}`
    : longDate(dates[0] ?? drop.pickup_date);
  const pickupShort = multiDay
    ? `PICKUP ${monthDay(dates[0]).toUpperCase()} – ${monthDay(dates[dates.length - 1]).toUpperCase()}`
    : `PICKUP ${monthDay(dates[0] ?? drop.pickup_date).toUpperCase()}`;

  return {
    id: drop.id,
    cookie: drop.cookie,
    desc: drop.description,
    photoUrl: drop.photo_url,
    pickupDateISO: drop.pickup_date,
    pickupDateLabel,
    pickupShort,
    deadlineLabel: deadlineLabel(deadline),
    deadlineAt: deadline.toISOString(),
    capacity: drop.capacity,
    reserved,
    remaining,
    pct: Math.min(100, Math.round((reserved / drop.capacity) * 100)),
    isOpen: drop.is_open,
    soldOut,
    orderable,
    availLine: availLine(reserved, drop.capacity),
    packages,
    windows: (winRows ?? []).map((w) => ({
      id: w.id,
      label: windowLabel(w.starts.slice(0, 5), w.ends.slice(0, 5)),
      full: w.is_full,
      starts: w.starts.slice(0, 5),
      ends: w.ends.slice(0, 5),
      dateISO: w.pickup_date as string,
      dateLabel: longDate(w.pickup_date as string),
    })),
  };
}
