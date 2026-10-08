import "server-only";
import { etOffset } from "./deadline";

const RESEND_URL = "https://api.resend.com/emails";
const FROM = "Manna Cookies & Co. <orders@mannacookiesmi.com>";
const BCC = ["j.komolmis7@gmail.com", "morristechnologies1@gmail.com"];

export interface OrderEmailInput {
  to: string;
  name: string;
  orderNumber: string; // "MC-1049"
  cookie: string;
  packageName: string; // "The Manna Half Dozen"
  cookieCount: number;
  totalCents: number;
  pickupDateLabel: string; // "Saturday, Oct 10"
  windowLabel: string; // "9:00 – 11:00 AM"
  pickupDateISO: string; // "2026-10-10"
  windowStart: string; // "09:00"
  windowEnd: string; // "11:00"
  pickupAddress?: string; // owner-configured; empty = "we'll text you"
}

const escIcs = (t: string) => t.replace(/[\r\n]+/g, " ").replace(/([,;\\])/g, "\\$1");
const escHtml = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Eastern wall-clock → UTC "YYYYMMDDTHHMMSSZ" for ICS/Google Calendar. */
function utcStamp(dateISO: string, time: string): string {
  const d = new Date(`${dateISO}T${time}:00${etOffset(dateISO)}`);
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function buildIcs(o: OrderEmailInput): string {
  const start = utcStamp(o.pickupDateISO, o.windowStart);
  const end = utcStamp(o.pickupDateISO, o.windowEnd);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Manna Cookies//EN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${o.orderNumber}@mannacookiesmi.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escIcs(`Pick up your Manna (${o.packageName})`)}`,
    `DESCRIPTION:${escIcs(`Order ${o.orderNumber} · ${o.cookie}`)}`,
    ...(o.pickupAddress ? [`LOCATION:${escIcs(o.pickupAddress)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function googleCalendarUrl(o: OrderEmailInput): string {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: `Pick up your Manna (${o.packageName})`,
    dates: `${utcStamp(o.pickupDateISO, o.windowStart)}/${utcStamp(o.pickupDateISO, o.windowEnd)}`,
    details: `Order ${o.orderNumber} · ${o.cookie}`,
    ...(o.pickupAddress ? { location: o.pickupAddress } : {}),
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

function orderHtml(o: OrderEmailInput): string {
  const total = `$${(o.totalCents / 100) % 1 === 0 ? o.totalCents / 100 : (o.totalCents / 100).toFixed(2)}`;
  // one fact per row — long combined values wrap badly in mail clients
  const rows: [string, string][] = [
    ["Cookie", o.cookie],
    ["Package", `${o.packageName} (${o.cookieCount} cookies)`],
    ["Order number", o.orderNumber],
    ["Pickup date", o.pickupDateLabel],
    ["Pickup window", o.windowLabel],
    ...(o.pickupAddress ? ([["Pickup address", o.pickupAddress]] as [string, string][]) : []),
    ["Total paid", total],
  ];
  const firstName = escHtml(o.name.split(" ")[0] || o.name);
  const addressRow = o.pickupAddress
    ? ""
    : `<p style="margin:22px auto 0;max-width:380px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.65;color:#8A7466;">We&rsquo;ll text you the pickup address before your window.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Your manna is reserved</title></head>
<body style="margin:0;padding:0;background-color:#F5EFE4;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Reserved: ${escHtml(o.packageName)} for pickup ${escHtml(o.pickupDateLabel)}, ${escHtml(o.windowLabel)}.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F5EFE4">
    <tr><td align="center" style="padding:36px 16px 48px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">
        <tr><td style="padding:0 0 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td width="10%" height="8" bgcolor="#4A2616" style="font-size:0;line-height:0;">&nbsp;</td><td width="10%" height="8" style="font-size:0;line-height:0;">&nbsp;</td>
            <td width="10%" height="8" bgcolor="#4A2616" style="font-size:0;line-height:0;">&nbsp;</td><td width="10%" height="8" style="font-size:0;line-height:0;">&nbsp;</td>
            <td width="10%" height="8" bgcolor="#4A2616" style="font-size:0;line-height:0;">&nbsp;</td><td width="10%" height="8" style="font-size:0;line-height:0;">&nbsp;</td>
            <td width="10%" height="8" bgcolor="#4A2616" style="font-size:0;line-height:0;">&nbsp;</td><td width="10%" height="8" style="font-size:0;line-height:0;">&nbsp;</td>
            <td width="10%" height="8" bgcolor="#4A2616" style="font-size:0;line-height:0;">&nbsp;</td><td width="10%" height="8" style="font-size:0;line-height:0;">&nbsp;</td>
          </tr></table>
        </td></tr>
        <tr><td bgcolor="#FBF8F1" style="background-color:#FBF8F1;border:1px solid #E6DCCB;padding:44px 32px 40px;" align="center">
          <img src="https://www.mannacookiesmi.com/logo.png" width="88" height="88" alt="Manna Cookies &amp; Co." style="display:block;width:88px;height:88px;border:0;margin:0 auto;">
          <div style="margin-top:26px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:4px;color:#8A6440;text-transform:uppercase;">Order&nbsp;Confirmed</div>
          <h1 style="margin:16px 0 0;font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:30px;line-height:1.15;color:#24150D;">Your manna is reserved.</h1>
          <p style="margin:16px auto 0;max-width:400px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#5A4334;">Thank you, ${firstName}. See you at pickup.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;border-top:1px solid #E6DCCB;">
            ${rows
              .map(
                ([k, v]) => `<tr>
              <td style="padding:13px 0;border-bottom:1px solid #E6DCCB;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#8A7466;text-align:left;white-space:nowrap;padding-right:16px;">${escHtml(k)}</td>
              <td style="padding:13px 0;border-bottom:1px solid #E6DCCB;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#24150D;text-align:right;">${escHtml(v)}</td>
            </tr>`,
              )
              .join("")}
          </table>
          ${addressRow}
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto 0;">
            <tr><td bgcolor="#24150D" style="background-color:#24150D;">
              <a href="${googleCalendarUrl(o)}" style="display:inline-block;padding:17px 30px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;letter-spacing:3px;color:#F5EFE4;text-decoration:none;text-transform:uppercase;">Add&nbsp;to&nbsp;Google&nbsp;Calendar</a>
            </td></tr>
          </table>
          <p style="margin:14px auto 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:#8A7466;">Apple&nbsp;Calendar or Outlook? Open the attached invite instead.</p>
        </td></tr>
        <tr><td align="center" style="padding:30px 20px 0;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:19px;color:#24150D;">Manna Cookies &amp; Co.</div>
          <div style="margin-top:4px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:15px;color:#8A6440;">Straight From Heaven.</div>
          <div style="margin-top:18px;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:3px;color:#8A7466;text-transform:uppercase;">EST. 2023 &middot; Small Batch &middot; Weekly</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Sends the branded order confirmation (with calendar invite attached) via
 * Resend. Never throws — checkout must succeed even if email hiccups.
 */
export async function sendOrderConfirmation(o: OrderEmailInput): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("order_email_skipped", { reason: "RESEND_API_KEY not set", order: o.orderNumber });
    return;
  }
  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [o.to],
        bcc: BCC,
        subject: `Your manna is reserved · ${o.orderNumber}`,
        html: orderHtml(o),
        attachments: [
          {
            filename: "manna-pickup.ics",
            content: Buffer.from(buildIcs(o)).toString("base64"),
            content_type: "text/calendar; method=PUBLISH",
          },
        ],
      }),
    });
    if (!res.ok) {
      console.error("order_email_failed", {
        order: o.orderNumber,
        status: res.status,
        body: (await res.text()).slice(0, 300),
      });
    }
  } catch (err) {
    console.error("order_email_failed", { order: o.orderNumber, err: String(err) });
  }
}
