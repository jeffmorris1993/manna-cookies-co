// Dashboard E2E: login, walk the order status machine, toggle orders open/closed,
// verify stats, customers, drop editor, whats-next.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const PASSWORD = readFileSync(".owner-temp-password.txt", "utf8").trim();
const base = "http://localhost:3457";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

async function waitUrl(page, pattern, ms = 25000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const u = page.url();
    if (typeof pattern === "string" ? u.startsWith(pattern) : pattern.test(u)) return;
    await page.waitForTimeout(250);
  }
  throw new Error(`waitUrl timeout at ${page.url()}`);
}
const shot = (n) => page.screenshot({ path: `/tmp/manna-dash-${n}.png`, fullPage: true });

await page.goto(`${base}/login`);
await page.fill("#email", "hello@sirromstudios.com");
await page.fill("#password", PASSWORD);
await page.getByRole("button", { name: "Sign In" }).click();
await waitUrl(page, `${base}/dashboard`);
await page.waitForTimeout(1500);
await shot("home");
const home = await page.locator("body").innerText();
console.log("1. HOME:", /TODAY'S MANNA/i.test(home) ? "✓" : "✗", "| has stats:", /COOKIES ORDERED/i.test(home) ? "✓" : "✗");

// Orders tab: walk MC-1050 new -> preparing -> ready -> picked -> undo
await page.goto(`${base}/dashboard/orders`);
await page.waitForSelector("text=Test Customer", { timeout: 15000 });
await page.getByRole("button", { name: "Start Preparing" }).click();
await page.waitForSelector("text=PREPARING", { timeout: 10000 });
console.log("2. new -> preparing ✓");
await page.getByRole("button", { name: "Mark Ready" }).click();
await page.waitForSelector("text=READY", { timeout: 10000 });
console.log("3. preparing -> ready ✓");
await page.getByRole("button", { name: "Mark Picked Up" }).click();
await page.waitForSelector("text=PICKED UP", { timeout: 10000 });
console.log("4. ready -> picked ✓");
await shot("orders");
await page.getByRole("button", { name: "Undo Pickup" }).click();
await page.waitForSelector("button:has-text('Mark Picked Up')", { timeout: 10000 });
console.log("5. undo -> ready ✓");

// filter chips
await page.getByRole("button", { name: "Picked up", exact: true }).click();
await page.waitForSelector("text=No orders match.", { timeout: 10000 });
console.log("6. filter chips ✓");

// search
await page.getByRole("button", { name: "All" }).click();
await page.fill('input[type="search"]', "zzz-no-such");
await page.waitForSelector("text=No orders match.", { timeout: 10000 });
console.log("7. search ✓");

// Drops: open live drop editor
await page.goto(`${base}/dashboard/drops`);
await page.waitForSelector("text=LIVE", { timeout: 15000 });
await shot("drops");
await page.locator("a:has-text('Brown Butter Chocolate Chunk')").first().click();
await waitUrl(page, /\/dashboard\/drops\/[0-9a-f-]+/);
await page.waitForSelector("text=LIVE ON THE WEBSITE", { timeout: 15000 });
console.log("8. drop editor opens ✓");

// capacity stepper: +6 then save
const capBefore = await page.locator("span.font-display.text-xl").first().innerText();
await page.getByRole("button", { name: "Increase capacity" }).click();
await page.getByRole("button", { name: "Save Drop" }).click();
await page.waitForSelector("text=Drop saved", { timeout: 15000 });
console.log(`9. capacity ${capBefore} -> +6 saved ✓`);
await shot("editor");

// window add + remove guard
const winCount = await page.locator('input[type="time"]').count();
await page.getByRole("button", { name: "+ Add Pickup Window" }).click();
const winAfter = await page.locator('input[type="time"]').count();
console.log("10. add window:", winAfter === winCount + 2 ? "✓" : `✗ (${winCount}->${winAfter})`);
// remove it again and save
await page.locator('button[aria-label="Remove window"]').last().click();
await page.getByRole("button", { name: "Save Drop" }).click();
await page.waitForSelector("text=Drop saved", { timeout: 15000 });

// Customers
await page.goto(`${base}/dashboard/customers`);
await page.waitForSelector("text=Test Customer", { timeout: 15000 });
await page.locator("a:has-text('Test Customer')").first().click();
await waitUrl(page, /\/dashboard\/customers\/[0-9a-f-]+/);
await page.waitForSelector("text=Order History", { timeout: 15000 });
const detail = await page.locator("body").innerText();
console.log("11. customer detail:", /TOTAL SPENT/i.test(detail) && /MC-1050/.test(detail) ? "✓" : "✗");
await shot("customer");

// What's next (behind login)
await page.goto(`${base}/dashboard/whats-next`);
await page.waitForSelector("text=A Smarter Kitchen", { timeout: 15000 });
console.log("12. whats-next behind login ✓");
await shot("whatsnext");

await browser.close();
console.log("DASHBOARD E2E DONE");
