/** America/New_York UTC offset (e.g. "-04:00") for a given calendar date. */
export function etOffset(dateISO: string): string {
  const probe = new Date(`${dateISO}T12:00:00Z`);
  const tzName = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "longOffset",
  })
    .formatToParts(probe)
    .find((p) => p.type === "timeZoneName")?.value; // e.g. "GMT-04:00"
  return tzName?.replace("GMT", "") || "-05:00";
}

/**
 * Ordering deadline = `daysBefore` days before pickup at 8:00 PM Eastern.
 * Returns an ISO timestamptz string for storage.
 */
export function deadlineTimestamp(pickupISO: string, daysBefore = 2): string {
  const [y, m, d] = pickupISO.split("-").map(Number);
  const deadlineDay = new Date(Date.UTC(y, m - 1, d));
  deadlineDay.setUTCDate(deadlineDay.getUTCDate() - daysBefore);
  const yy = deadlineDay.getUTCFullYear();
  const mm = String(deadlineDay.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(deadlineDay.getUTCDate()).padStart(2, "0");

  // America/New_York offset for that date (handles DST)
  const probe = new Date(`${yy}-${mm}-${dd}T12:00:00Z`);
  const tzName = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "longOffset",
  })
    .formatToParts(probe)
    .find((p) => p.type === "timeZoneName")?.value; // e.g. "GMT-04:00"
  const offset = tzName?.replace("GMT", "") || "-05:00";

  return `${yy}-${mm}-${dd}T20:00:00${offset}`;
}

/**
 * Earliest pickup date (YYYY-MM-DD) whose deadline hasn't already passed:
 * the smallest date where (date − daysBefore) 8:00 PM ET is still in the future.
 */
export function earliestPickupDate(daysBefore: number, now: Date = new Date()): string {
  const probe = new Date(now);
  for (let i = 0; i < 30; i++) {
    const iso = probe.toISOString().slice(0, 10);
    if (new Date(deadlineTimestamp(iso, daysBefore)).getTime() > now.getTime()) return iso;
    probe.setUTCDate(probe.getUTCDate() + 1);
  }
  return probe.toISOString().slice(0, 10);
}
