import { chromium } from "playwright";

async function main() {
  const base = process.argv[2] ?? "http://localhost:3001";
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--ignore-gpu-blocklist",
    ],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto(base + "/", { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: "/tmp/land-os.png" });

  // Switch to the Josh segment — avatar + control should re-skin.
  await page.getByRole("tab", { name: /Personal AI Projects/i }).click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "/tmp/land-josh.png" });

  // Back to OneSignal once the canvas is warm — confirms the OneSignal avatar
  // renders (the default-load capture can race the GLB fetch).
  await page.getByRole("tab", { name: /OneSignal Projects/i }).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "/tmp/land-os-warm.png" });

  // Orbit legend with the AI sub-filter.
  await page.goto(base + "/orbit?focus=onesignal", { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(4500);
  await page.screenshot({ path: "/tmp/land-orbit.png" });

  console.log("✓ wrote /tmp/land-os.png, /tmp/land-josh.png, /tmp/land-orbit.png");
  await browser.close();
}

main().catch((e) => {
  console.error("✗", e instanceof Error ? e.message : e);
  process.exit(1);
});
