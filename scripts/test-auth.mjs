// Auth verification: wrong password rejected, right password lands on
// /dashboard, backdated session cookies force re-login.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const PASSWORD = (process.env.MC_TEST_PASSWORD ?? "").trim();
if (!PASSWORD) { console.error("Set MC_TEST_PASSWORD"); process.exit(1); }
const base = "http://localhost:3457";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

async function waitUrl(page, pattern, ms = 25000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const u = page.url();
    if (typeof pattern === "string" ? u === pattern || u.startsWith(pattern) : pattern.test(u)) return;
    await page.waitForTimeout(250);
  }
  throw new Error(`waitUrl timeout: still at ${page.url()} — body: ${(await page.locator("body").innerText().catch(()=>"?")).slice(0,200)}`);
}


// 1. wrong password
await page.goto(`${base}/login`);
await page.fill("#email", "hello@sirromstudios.com");
await page.fill("#password", "definitely-wrong-password");
await page.getByRole("button", { name: "Sign In" }).click();
await page.waitForSelector("text=Incorrect email or password.", { timeout: 15000 });
console.log("1. wrong password -> generic error ✓");

// 2. right password
await page.fill("#password", PASSWORD);
await page.getByRole("button", { name: "Sign In" }).click();
await waitUrl(page, `${base}/dashboard`);
console.log("2. correct password -> /dashboard ✓");

// 3. backdate mc_sess_start by 8 days -> absolute cap kicks in
const cookies = await ctx.cookies(base);
const sess = cookies.find((c) => c.name === "mc_sess_start");
await ctx.addCookies([
  { ...sess, value: String(Date.now() - 8 * 24 * 3600 * 1000) },
]);
await page.goto(`${base}/dashboard`);
await page.waitForURL(/\/login\?expired=1/, { timeout: 15000 });
console.log("3. 8-day-old session -> kicked to /login?expired=1 ✓");

// 4. sign back in, then backdate mc_last_seen by 25h -> idle cap
await page.fill("#email", "hello@sirromstudios.com");
await page.fill("#password", PASSWORD);
await page.getByRole("button", { name: "Sign In" }).click();
await waitUrl(page, `${base}/dashboard`);
const cookies2 = await ctx.cookies(base);
const seen = cookies2.find((c) => c.name === "mc_last_seen");
await ctx.addCookies([{ ...seen, value: String(Date.now() - 25 * 3600 * 1000) }]);
await page.goto(`${base}/dashboard`);
await page.waitForURL(/\/login\?expired=1/, { timeout: 15000 });
console.log("4. 25h idle -> kicked to /login?expired=1 ✓");

// 5. login page redirects away when already authed
await page.fill("#email", "hello@sirromstudios.com");
await page.fill("#password", PASSWORD);
await page.getByRole("button", { name: "Sign In" }).click();
await waitUrl(page, `${base}/dashboard`);
await page.goto(`${base}/login`);
await waitUrl(page, `${base}/dashboard`);
console.log("5. authed visit to /login -> bounced to /dashboard ✓");

await browser.close();
console.log("ALL AUTH CHECKS PASSED");
