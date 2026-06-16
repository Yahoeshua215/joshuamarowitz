import { chromium } from "playwright";

/** Single default-view screenshot of the orbit scene (no interaction). */
async function main() {
  const url = process.argv[2] ?? "http://localhost:3001/orbit";
  const out = process.argv[3] ?? "/tmp/orbit-eclipse.png";
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--ignore-gpu-blocklist",
    ],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(4500); // curtain lift + textures, before auto-rotate drifts far
  await page.screenshot({ path: out });
  console.log(`✓ wrote ${out}`);
  await browser.close();
}

main().catch((e) => {
  console.error("✗", e instanceof Error ? e.message : e);
  process.exit(1);
});
