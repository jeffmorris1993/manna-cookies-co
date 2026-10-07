import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";

const PHASE2 = [
  ["Production / Bake Sheets", "Customer orders become total cookies required and suggested batches."],
  ["Ingredient Calculator", "The private recipe scaled to the number of cookies being produced."],
  ["Inventory", "Record ingredients on hand and see what still needs to be purchased."],
  ["Automatically Generated Shopping List", "Built from the bake sheet and current inventory."],
  ["Pickup Reminders", "SMS and email reminders sent before pickup."],
  ["Customer History", "Repeat customers and purchasing patterns."],
];

const PHASE3 = [
  "Cookie Drops",
  "Sold-Out Waitlist",
  "Manna Club / Subscription",
  "Repeat Orders",
  "Gift Orders",
  "Corporate Orders",
  "Church / Event Orders",
  "Holiday Boxes",
  "Referral Program",
  "Loyalty Program",
];

const PHASE4 = [
  [
    "AI Kitchen Assistant",
    "Tomorrow's bake, planned: batches to brown tonight, dough timing, trays, and which pickup window to pack first.",
  ],
  [
    "AI Inventory & Shopping",
    "Knows what's on hand and what Saturday needs — tells you what to buy before Friday.",
  ],
  [
    "AI Demand Forecasting",
    "Learns your sell-through week over week and suggests how many cookies to prepare.",
  ],
  [
    "AI Marketing Assistant",
    "One cookie photo in. Captions and announcements for every channel out.",
  ],
  [
    "AI Business Summary",
    "Your week at Manna: sales, repeat customers, average order, and suggested next actions.",
  ],
];

export default async function WhatsNextPage() {
  await connection();
  try {
    await requireOwner();
  } catch {
    redirect("/login");
  }

  return (
    <main className="pt-8">
      <span className="eyebrow text-brown-muted">What&apos;s Next</span>
      <h1 className="mt-3 font-display text-4xl font-medium leading-tight text-ink">
        From a website to the way Manna <em className="text-brown-muted">runs.</em>
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
        Launch with the essentials. Then add tools for the kitchen, the following, and eventually a
        quiet assistant working behind the scenes.
      </p>

      <section className="mt-8 border border-brown/10 bg-cream-raised px-5 py-5">
        <div className="flex items-center justify-between">
          <span className="eyebrow text-muted-2" style={{ fontSize: "9px" }}>
            Phase 1 · Launch
          </span>
          <span className="eyebrow rounded-full bg-brown px-3 py-1 text-cream" style={{ fontSize: "7.5px" }}>
            Live Now
          </span>
        </div>
        <h2 className="mt-2 font-display text-2xl text-ink">The Foundation</h2>
        <p className="mt-2 text-sm text-muted">
          Everything needed to take orders, get paid and hand off cookies without spreadsheets or
          DMs.
        </p>
        <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-ink">
          {[
            "Website",
            "Mobile ordering",
            "Payments",
            "Pickup scheduling",
            "Order management",
            "Capacity / sold-out controls",
            "Owner dashboard",
            "Customer records",
          ].map((x) => (
            <li key={x} className="flex items-center gap-2">
              <span className="h-1 w-1 flex-none rounded-full bg-brown" />
              {x}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 border border-brown/10 bg-cream-raised px-5 py-5">
        <span className="eyebrow text-muted-2" style={{ fontSize: "9px" }}>
          Phase 2 · Run the Kitchen
        </span>
        <h2 className="mt-2 font-display text-2xl text-ink">Make Baking Easier</h2>
        <div className="mt-4 flex flex-col gap-4">
          {PHASE2.map(([t, d]) => (
            <div key={t}>
              <p className="text-sm font-medium text-ink">{t}</p>
              <p className="mt-0.5 text-sm text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 border border-brown/10 bg-cream-raised px-5 py-5">
        <span className="eyebrow text-muted-2" style={{ fontSize: "9px" }}>
          Phase 3 · Grow Manna
        </span>
        <h2 className="mt-2 font-display text-2xl text-ink">Build the Following</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {PHASE3.map((t, i) => (
            <div key={t} className="border border-brown/10 px-4 py-3">
              <span className="eyebrow text-brown-muted" style={{ fontSize: "8px" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-1 text-sm text-ink">{t}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 bg-ink px-5 py-6 text-cream">
        <span className="eyebrow text-gold" style={{ fontSize: "9px" }}>
          Phase 4 · Manna AI
        </span>
        <h2 className="mt-2 font-display text-2xl">A Smarter Kitchen</h2>
        <p className="mt-2 text-sm leading-relaxed text-cream-dark-muted">
          Assistance that works in the background of the owner dashboard. Customers never talk to a
          bot; the owner gets plans, numbers and drafts ready to use.
        </p>
        <div className="mt-5 flex flex-col gap-4">
          {PHASE4.map(([t, d]) => (
            <div key={t} className="border-t border-cream/10 pt-4">
              <p className="eyebrow text-gold" style={{ fontSize: "8.5px" }}>
                {t}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-cream-dark-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="eyebrow mt-8 pb-4 text-center text-muted-2" style={{ fontSize: "8px" }}>
        Powered by Sirrom Studios
      </p>
    </main>
  );
}
