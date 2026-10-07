// E2E sandbox checkout: select package → details → window → pay with test card.
// Usage: node scripts/test-checkout.mjs [cardNumber] (default 4111... success card)
import { chromium } from "playwright";

const CARD = process.argv[2] ?? "4111 1111 1111 1111";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on("console", (m) => {
  if (m.type() === "error") console.log("[console.error]", m.text().slice(0, 200));
});

await page.goto("http://localhost:3457", { waitUntil: "networkidle" });
await page.evaluate(() => sessionStorage.setItem("manna_intro_v2", "1"));
await page.reload({ waitUntil: "networkidle" });

// jump to the order section and pick the half dozen
await page.evaluate(() => document.getElementById("order")?.scrollIntoView());
await page.waitForTimeout(1200);
await page.getByRole("button", { name: /THE MANNA HALF DOZEN/i }).click({ force: true });

// step 2: details
await page.waitForSelector("#co-name");
await page.fill("#co-name", "Test Customer");
await page.fill("#co-phone", "202-555-0147");
await page.fill("#co-email", "test.customer@example.com");
await page.getByRole("button", { name: "Continue" }).click({ force: true });

// step 3: window
await page.getByRole("button", { name: /9:00 – 11:00 AM/ }).click({ force: true });
await page.getByRole("button", { name: "Continue" }).click({ force: true });

// step 4: Square card iframe
await page.waitForSelector("#card-container iframe", { timeout: 30000 });
const frame = page.frameLocator("#card-container iframe").first();
await frame.locator("#cardNumber").fill(CARD);
await frame.locator("#expirationDate").fill("12/27");
await frame.locator("#cvv").fill("111");
await frame.locator("#postalCode").fill("20500");

await page.waitForSelector('button:not([disabled]):has-text("Pay $")', { timeout: 30000 });
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((b) => /^PAY \$/i.test(b.textContent.trim()));
  btn?.click();
});

// outcome: confirmation or error text
try {
  await page.waitForSelector("text=YOUR MANNA IS RESERVED.", { timeout: 45000 });
  const orderNo = await page
    .locator("text=/MC-\\d+/")
    .first()
    .textContent();
  console.log("SUCCESS — confirmation shown, order:", orderNo?.trim());
  await page.screenshot({ path: "/tmp/manna-checkout-confirm.png" });
} catch {
  const err = await page.locator(".text-error").first().textContent().catch(() => null);
  console.log("NO CONFIRMATION — error shown:", err);
  await page.screenshot({ path: "/tmp/manna-checkout-fail.png", fullPage: true });
  process.exitCode = 1;
}
await browser.close();
