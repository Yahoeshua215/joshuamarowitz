import { chromium } from "playwright";
import { FileContentStore } from "../src/lib/store/file-store";

/**
 * Grab a Dribbble shot's full image and attach it as a project's screenshot.
 * Uses the shot page's og:image (the full-res shot) when available, falling
 * back to the largest <img> in the shot media.
 *
 *   tsx scripts/shoot-dribbble.ts <shot-url> <slug>
 */
async function main() {
  const url = process.argv[2];
  const slug = process.argv[3];
  if (!url || !slug) {
    console.error("usage: tsx scripts/shoot-dribbble.ts <shot-url> <slug>");
    process.exit(1);
  }

  const store = new FileContentStore();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1200 },
    deviceScaleFactor: 2,
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    locale: "en-US",
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(1500);

    const imageUrl = await page.evaluate(() => {
      const og = document
        .querySelector('meta[property="og:image"]')
        ?.getAttribute("content");
      if (og) return og;
      // Fallback: largest rendered <img> on the shot page.
      let best: string | null = null;
      let bestArea = 0;
      document.querySelectorAll("img").forEach((img) => {
        const area = img.naturalWidth * img.naturalHeight;
        const src = img.currentSrc || img.src;
        if (src && area > bestArea) {
          bestArea = area;
          best = src;
        }
      });
      return best;
    });

    if (!imageUrl) throw new Error("no shot image found on page");

    // Download the actual image bytes via a request from the page context.
    const resp = await context.request.get(imageUrl);
    if (!resp.ok()) throw new Error(`image fetch failed: ${resp.status()}`);
    const buffer = await resp.body();

    const savedSrc = await store.saveImage(slug, "screenshot.png", buffer);

    const project = await store.getProject(slug);
    if (project) {
      const rest = project.images.filter(
        (img) => !img.src.includes("placeholder") && img.src !== savedSrc
      );
      await store.upsertProject({
        ...project,
        images: [{ src: savedSrc, alt: `${project.title} screenshot` }, ...rest],
      });
    }

    console.log(`✓ Saved Dribbble shot for ${slug}: ${savedSrc}`);
    console.log(`  source: ${imageUrl}`);
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
