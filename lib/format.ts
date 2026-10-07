export function formatMoney(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

/** "2026-10-10" -> "Saturday, Oct 10" (parsed as a plain date, no TZ shift) */
export function longDate(iso: string): string {
  const d = parseISODate(iso);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

/** "2026-10-10" -> "Oct 10" */
export function monthDay(iso: string): string {
  return parseISODate(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** "2026-10-10" -> "SAT, OCT 10" */
export function shortDate(iso: string): string {
  const d = parseISODate(iso);
  return d
    .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    .toUpperCase();
}

export function parseISODate(iso: string): Date {
  const [y, m, day] = iso.split("-").map(Number);
  return new Date(y, m - 1, day, 12, 0, 0); // noon avoids DST edges
}

/** Deadline = pickup date − 2 days at 8:00 PM, e.g. "Thursday, Oct 8 · 8:00 PM" */
export function deadlineFor(pickupISO: string): Date {
  const d = parseISODate(pickupISO);
  d.setDate(d.getDate() - 2);
  d.setHours(20, 0, 0, 0);
  return d;
}

export function deadlineLabel(deadline: Date): string {
  const day = deadline.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const time = deadline
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    .replace(" ", " ");
  return `${day} · ${time}`;
}

/** "09:00","11:00" -> "9:00 – 11:00 AM"; collapses matching meridiems like the prototype */
export function windowLabel(start: string, end: string): string {
  const f = (t: string, withM: boolean) => {
    const [h, m] = t.split(":").map(Number);
    const mer = h >= 12 ? "PM" : "AM";
    const hr = h % 12 === 0 ? 12 : h % 12;
    const mm = m === 0 ? ":00" : `:${String(m).padStart(2, "0")}`;
    return withM ? `${hr}${mm} ${mer}` : `${hr}${mm}`;
  };
  const merOf = (t: string) => (Number(t.split(":")[0]) >= 12 ? "PM" : "AM");
  return merOf(start) === merOf(end)
    ? `${f(start, false)} – ${f(end, true)}`
    : `${f(start, true)} – ${f(end, true)}`;
}

/** Normalize a US-or-international phone to E.164-ish; returns null if too few digits. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 7) return null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (raw.trim().startsWith("+")) return `+${digits}`;
  return `+${digits}`;
}

export function displayOrderNumber(n: number): string {
  return `MC-${n}`;
}
