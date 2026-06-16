import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--ignore-gpu-blocklist",
    ],
  });
  const page = await browser.newPage({ viewport: { width: 414, height: 896 } });
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(4500);
  await page.screenshot({ path: "/tmp/land-mobile.png", fullPage: true });
  console.log("✓ wrote /tmp/land-mobile.png");
  await browser.close();
}

main().catch((e) => {
  console.error("✗", e instanceof Error ? e.message : e);
  process.exit(1);
});
