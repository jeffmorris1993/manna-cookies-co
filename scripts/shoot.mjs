// Dev screenshot helper: node scripts/shoot.mjs <url> <outPrefix> [fullpage]
import { chromium } from "playwright";

const [url = "http://localhost:3457", prefix = "/tmp/shot", full = "1"] = process.argv.slice(2);
const browser = await chromium.launch();
for (const [name, w, h] of [
  ["mobile", 375, 812],
  ["desktop", 1440, 900],
]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(url, { waitUntil: "networkidle" });
  // skip the intro overlay + let reveals fire
  await page.evaluate(() => {
    document.querySelector('button[aria-label="Skip intro"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await page.waitForTimeout(600);
  await page.evaluate(async () => {
    // scroll through the page so IntersectionObserver reveals everything
    for (let y = 0; y <= document.body.scrollHeight; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 130));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${prefix}-${name}.png`, fullPage: full === "1" });
  await page.close();
}
await browser.close();
console.log("done");
