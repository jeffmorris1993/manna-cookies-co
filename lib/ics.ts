/**
 * Client-side ICS calendar file generator, ported from the prototype.
 * Builds a pickup event and triggers a download named manna-pickup.ics.
 */
export function downloadPickupIcs(opts: {
  orderNumber: string; // "MC-1049"
  packageName: string; // "The Manna Half Dozen"
  cookie: string;
  pickupDateISO: string; // "2026-10-10"
  windowStart: string; // "09:00"
  windowEnd: string; // "11:00"
}) {
  const d = opts.pickupDateISO.replaceAll("-", "");
  const s = opts.windowStart.replace(":", "") + "00";
  const e = opts.windowEnd.replace(":", "") + "00";
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const uid = `${opts.orderNumber}-${Date.now()}@mannacookies`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Manna Cookies//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${d}T${s}`,
    `DTEND:${d}T${e}`,
    `SUMMARY:Pick up your Manna (${opts.packageName.toUpperCase()})`,
    `DESCRIPTION:Order ${opts.orderNumber} · ${opts.cookie}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "manna-pickup.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
