import { connection } from "next/server";
import Image from "next/image";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import PromoGenerator from "@/components/dashboard/PromoGenerator";

const PHASE1 = [
  "Website",
  "Mobile ordering",
  "Payments",
  "Pickup scheduling",
  "Order management",
  "Capacity / sold-out controls",
  "Owner dashboard",
  "Customer records",
];

const PHASE2 = [
  ["Production / Bake Sheets", "Customer orders become total cookies required and suggested batches."],
  ["Ingredient Calculator", "The private recipe scaled to the number of cookies being produced."],
  ["Inventory", "Record ingredients on hand and see what still needs to be purchased."],
  ["Automatically Generated Shopping List", "Built from the bake sheet and current inventory."],
  ["Pickup Reminders", "SMS and email reminders sent before pickup."],
  ["Customer History", "Repeat customers and purchasing patterns."],
] as const;

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

const EYEBROW = (color: string): React.CSSProperties => ({
  fontSize: 11,
  letterSpacing: ".2em",
  fontWeight: 500,
  color,
});
const BIG_TITLE: React.CSSProperties = {
  marginTop: 12,
  fontSize: "clamp(32px,4vw,44px)",
  lineHeight: 1.05,
};

export default async function WhatsNextPage() {
  await connection();
  try {
    await requireOwner();
  } catch {
    redirect("/login");
  }

  return (
    <main style={{ padding: "12px 0 40px", animation: "mannaIn .35s ease" }}>
      <div style={EYEBROW("#8A6440")}>WHAT&apos;S NEXT</div>
      <h1
        className="font-display"
        style={{ margin: "20px 0 0", fontWeight: 500, fontSize: "clamp(40px,6.5vw,80px)", lineHeight: 1.02, maxWidth: 820 }}
      >
        From a website to the way Manna <span style={{ fontStyle: "italic" }}>runs.</span>
      </h1>
      <p style={{ margin: "24px 0 0", maxWidth: 560, fontSize: 17, lineHeight: 1.7, color: "#5A4334" }}>
        Launch with the essentials. Then add tools for the kitchen, the following, and eventually a
        quiet assistant working behind the scenes.
      </p>

      {/* phase ribbon */}
      <div
        style={{
          margin: "48px 0 40px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))",
          gap: 10,
        }}
      >
        {(
          [
            ["PHASE 1 · LAUNCH", "The Foundation", true],
            ["PHASE 2 · RUN THE KITCHEN", "Make Baking Easier", false],
            ["PHASE 3 · GROW MANNA", "Build the Following", false],
            ["PHASE 4 · MANNA AI", "A Smarter Kitchen", false],
          ] as const
        ).map(([k, t, first]) => (
          <div key={k} style={{ borderTop: `2px solid ${first ? "#24150D" : "rgba(74,38,22,.3)"}`, paddingTop: 14 }}>
            <div style={{ fontSize: 11, letterSpacing: ".2em", color: "#8A6440" }}>{k}</div>
            <div className="font-display" style={{ marginTop: 6, fontSize: 20 }}>
              {t}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* phase 1 */}
        <div
          style={{
            background: "#FBF8F1",
            borderRadius: 20,
            padding: "clamp(24px,4vw,44px)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))",
            gap: 28,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={EYEBROW("#8A6440")}>PHASE 1 — LAUNCH</span>
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: ".16em",
                  fontWeight: 600,
                  padding: "5px 10px",
                  borderRadius: 999,
                  background: "#24150D",
                  color: "#F5EFE4",
                }}
              >
                LIVE NOW
              </span>
            </div>
            <div className="font-display" style={BIG_TITLE}>
              THE FOUNDATION
            </div>
            <p style={{ margin: "14px 0 0", color: "#5A4334", lineHeight: 1.65, maxWidth: 380 }}>
              Everything needed to take orders, get paid and hand off cookies without spreadsheets
              or DMs.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px", alignContent: "start" }}>
            {PHASE1.map((i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  fontSize: 15,
                  padding: "10px 0",
                  borderBottom: "1px solid rgba(74,38,22,.12)",
                }}
              >
                <span style={{ flex: "0 0 auto", width: 6, height: 6, borderRadius: "50%", background: "#4A2616" }} />
                {i}
              </div>
            ))}
          </div>
        </div>

        {/* phase 2 */}
        <div
          style={{
            background: "#FBF8F1",
            borderRadius: 20,
            padding: "clamp(24px,4vw,44px)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))",
            gap: 28,
          }}
        >
          <div>
            <div style={EYEBROW("#8A6440")}>PHASE 2 — RUN THE KITCHEN</div>
            <div className="font-display" style={BIG_TITLE}>
              MAKE BAKING EASIER
            </div>
            <div style={{ marginTop: 22, display: "flex", flexDirection: "column" }}>
              {PHASE2.map(([t, d]) => (
                <div key={t} style={{ padding: "12px 0", borderBottom: "1px solid rgba(74,38,22,.12)" }}>
                  <div style={{ fontWeight: 500 }}>{t}</div>
                  <div style={{ marginTop: 3, fontSize: 14, color: "#5A4334", lineHeight: 1.5 }}>{d}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ alignSelf: "start", background: "#F2EBDF", borderRadius: 16, padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, letterSpacing: ".2em", fontWeight: 500 }}>SATURDAY BAKE SHEET</span>
              <span style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 10, color: "#6E5546" }}>
                example
              </span>
            </div>
            <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {(
                [
                  ["138", "Cookies ordered", false],
                  ["6", "Batches required", true],
                  ["144", "Recommended cookies", false],
                  ["6", "Extra cookies", false],
                ] as const
              ).map(([v, l, dark]) => (
                <div
                  key={l}
                  style={{
                    background: dark ? "#24150D" : "#FBF8F1",
                    color: dark ? "#F5EFE4" : undefined,
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <div className="font-display" style={{ fontSize: 36, lineHeight: 1 }}>
                    {v}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, color: dark ? "#D9C8B3" : "#5A4334" }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 6 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} style={{ height: 30, borderRadius: 6, background: "#4A2616" }} />
              ))}
              <div
                style={{ height: 30, borderRadius: 6, background: "linear-gradient(90deg,#4A2616 75%,#C9A57E 75%)" }}
              />
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "#6E5546" }}>
              6 batches of 24 · last batch has 6 extra
            </div>
          </div>
        </div>

        {/* phase 3 */}
        <div style={{ background: "#FBF8F1", borderRadius: 20, padding: "clamp(24px,4vw,44px)" }}>
          <div style={EYEBROW("#8A6440")}>PHASE 3 — GROW MANNA</div>
          <div className="font-display" style={BIG_TITLE}>
            BUILD THE FOLLOWING
          </div>
          <div
            style={{
              marginTop: 24,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,200px),1fr))",
              gap: 10,
            }}
          >
            {PHASE3.map((t, i) => (
              <div
                key={t}
                style={{
                  border: "1px solid rgba(74,38,22,.2)",
                  borderRadius: 14,
                  padding: 16,
                  minHeight: 96,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <span className="font-display italic" style={{ color: "#8A6440" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ fontWeight: 500 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* phase 4 — dark AI card */}
        <div style={{ background: "#24150D", color: "#F5EFE4", borderRadius: 20, padding: "clamp(24px,4vw,44px)" }}>
          <div style={EYEBROW("#C9A57E")}>PHASE 4 — MANNA AI</div>
          <div className="font-display" style={BIG_TITLE}>
            A SMARTER KITCHEN
          </div>
          <p style={{ margin: "14px 0 0", maxWidth: 520, color: "#D9C8B3", lineHeight: 1.65 }}>
            Assistance that works in the background of the owner dashboard. Customers never talk to
            a bot; the owner gets plans, numbers and drafts ready to use.
          </p>

          <div
            style={{
              marginTop: 32,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))",
              gap: 14,
            }}
          >
            <div style={{ background: "#F5EFE4", color: "#24150D", borderRadius: 16, padding: 20 }}>
              <div style={EYEBROW("#8A6440")}>AI KITCHEN ASSISTANT</div>
              <div className="font-display" style={{ marginTop: 8, fontSize: 24 }}>
                Tomorrow&apos;s Bake
              </div>
              <div
                style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, textAlign: "center" }}
              >
                {(
                  [
                    ["31", "Customers"],
                    ["162", "Cookies"],
                    ["7", "Batches"],
                    ["$734", "Revenue"],
                  ] as const
                ).map(([v, l]) => (
                  <div key={l}>
                    <div className="font-display" style={{ fontSize: 24 }}>
                      {v}
                    </div>
                    <div style={{ fontSize: 11, color: "#5A4334" }}>{l}</div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 14,
                  borderTop: "1px solid rgba(74,38,22,.15)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {[
                  "Brown butter for 7 batches tonight and chill overnight.",
                  "Mix dough by 9 AM; portion 168 balls (6 spare).",
                  "Bake 6:00–8:30 AM Saturday, two trays per batch.",
                  "Pack the 9–11 AM window first: 14 orders.",
                ].map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: 10 }}>
                    <span style={{ color: "#8A6440", fontWeight: 600 }}>{i + 1}</span>
                    {t}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                style={{
                  background: "rgba(245,239,228,.08)",
                  border: "1px solid rgba(245,239,228,.14)",
                  borderRadius: 16,
                  padding: 20,
                }}
              >
                <div style={EYEBROW("#C9A57E")}>AI INVENTORY &amp; SHOPPING</div>
                <div className="font-display" style={{ marginTop: 12, fontSize: 19, lineHeight: 1.45 }}>
                  &ldquo;You have enough flour and butter for Saturday&apos;s bake. Purchase
                  approximately 4 additional pounds of chocolate before Friday.&rdquo;
                </div>
              </div>
              <div
                style={{
                  background: "rgba(245,239,228,.08)",
                  border: "1px solid rgba(245,239,228,.14)",
                  borderRadius: 16,
                  padding: 20,
                }}
              >
                <div style={EYEBROW("#C9A57E")}>AI DEMAND FORECASTING</div>
                <div style={{ marginTop: 14, display: "flex", alignItems: "flex-end", gap: 10, height: 84 }}>
                  {(
                    [
                      [62, "SEP 12", "#8A6440"],
                      [68, "SEP 19", "#8A6440"],
                      [64, "SEP 26", "#8A6440"],
                      [69, "OCT 3", "#C9A57E"],
                    ] as const
                  ).map(([h, l, c]) => (
                    <div
                      key={l}
                      style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
                    >
                      <div style={{ width: "100%", height: h, background: c, borderRadius: "4px 4px 0 0" }} />
                      <span style={{ fontSize: 10, color: "#D9C8B3" }}>{l}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, fontSize: 15, lineHeight: 1.55 }}>
                  &ldquo;Your last four Saturday drops averaged 82% sell-through. Consider preparing
                  approximately 144 cookies this week.&rdquo;
                </div>
              </div>
            </div>

            <div
              style={{
                background: "rgba(245,239,228,.08)",
                border: "1px solid rgba(245,239,228,.14)",
                borderRadius: 16,
                padding: 20,
              }}
            >
              <div style={EYEBROW("#C9A57E")}>AI MARKETING ASSISTANT</div>
              <div style={{ marginTop: 14, display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ flex: "0 0 auto", width: 84, height: 84, borderRadius: 12, overflow: "hidden" }}>
                  <Image
                    src="/sea-salt.jpg"
                    alt="Uploaded cookie photo"
                    width={84}
                    height={84}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
                <div style={{ fontSize: 14, color: "#D9C8B3", lineHeight: 1.5 }}>
                  One cookie photo in. Captions and announcements for every channel out.
                </div>
              </div>
              <PromoGenerator />
            </div>

            <div style={{ background: "#F5EFE4", color: "#24150D", borderRadius: 16, padding: 20 }}>
              <div style={EYEBROW("#8A6440")}>AI BUSINESS SUMMARY</div>
              <div className="font-display" style={{ marginTop: 8, fontSize: 24 }}>
                Your week at Manna
              </div>
              <div
                style={{
                  marginTop: 14,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 1,
                  background: "rgba(74,38,22,.12)",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {(
                  [
                    ["SALES", "$734"],
                    ["ORDERS", "31"],
                    ["REPEAT CUSTOMERS", "12"],
                    ["AVERAGE ORDER", "$23.68"],
                    ["MOST COMMON", "Half Dozen"],
                    ["SELL-THROUGH", "94%"],
                  ] as const
                ).map(([l, v]) => (
                  <div key={l} style={{ background: "#FBF8F1", padding: 12 }}>
                    <div style={{ fontSize: 10, letterSpacing: ".14em", color: "#6E5546" }}>{l}</div>
                    <div className="font-display" style={{ marginTop: 3, fontSize: 20 }}>
                      {v}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, fontSize: 11, letterSpacing: ".2em", fontWeight: 500, color: "#6E5546" }}>
                SUGGESTED NEXT ACTIONS
              </div>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8, fontSize: 14, lineHeight: 1.5 }}>
                {[
                  "Open next week's drop at 150 cookies; you sold out by Wednesday.",
                  "Text the 9 customers on the waitlist first.",
                  "Feature the Half Dozen in this week's post.",
                ].map((t) => (
                  <div key={t} style={{ display: "flex", gap: 10 }}>
                    <span
                      style={{ flex: "0 0 auto", width: 6, height: 6, borderRadius: "50%", background: "#4A2616", marginTop: 8 }}
                    />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "60px 0 20px", textAlign: "center" }}>
        <Image
          src="/logo.png"
          alt=""
          width={88}
          height={88}
          style={{ width: 88, height: 88, display: "block", margin: "0 auto" }}
        />
        <div className="font-display" style={{ marginTop: 16, fontSize: 24 }}>
          One really good cookie, made really well.
        </div>
        <div className="font-display italic" style={{ marginTop: 6, color: "#8A6440", fontSize: 20 }}>
          Straight From Heaven.
        </div>
        <div style={{ marginTop: 36, fontSize: 10, letterSpacing: ".24em", color: "#6E5546" }}>
          POWERED BY SIRROM STUDIOS
        </div>
      </div>
    </main>
  );
}
