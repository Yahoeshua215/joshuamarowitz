import { chromium } from "playwright";
import { FileContentStore } from "../src/lib/store/file-store";

/**
 * Capture a screenshot of a *live* public URL and attach it to a project.
 * Unlike `screenshots.ts` (which boots each project's local dev server), this
 * just hits the deployed site — handy for projects that are already shipped.
 *
 *   tsx scripts/shoot-url.ts <url> <slug>
 */
async function main() {
  const url = process.argv[2];
  const slug = process.argv[3];
  if (!url || !slug) {
    console.error("usage: tsx scripts/shoot-url.ts <url> <slug>");
    process.exit(1);
  }

  const store = new FileContentStore();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    // A realistic UA + headers so bot/WAF protection doesn't serve us a 403.
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    locale: "en-US",
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    },
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page
      .waitForLoadState("networkidle", { timeout: 15000 })
      .catch(() => {});
    await new Promise((r) => setTimeout(r, 2200));
    const buffer = await page.screenshot({ type: "png", fullPage: false });
    const src = await store.saveImage(slug, "screenshot.png", buffer);

    const project = await store.getProject(slug);
    if (project) {
      const rest = project.images.filter(
        (img) => !img.src.includes("placeholder") && img.src !== src
      );
      await store.upsertProject({
        ...project,
        images: [{ src, alt: `${project.title} screenshot` }, ...rest],
      });
    }

    console.log(`✓ Saved screenshot for ${slug}: ${src}`);
  } catch (error) {
    console.error(
      `✗ Failed ${slug}:`,
      error instanceof Error ? error.message : error
    );
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
