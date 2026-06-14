import { chromium } from "playwright";
import { FileContentStore } from "../src/lib/store/file-store";

/**
 * For a Zight share link that is actually an *image* (not a video), use it as
 * the project's screenshot and remove the misclassified `video` link so the UI
 * stops calling it a "walkthrough". If the project already has a real
 * screenshot, that's kept — we only strip the bad link.
 *
 *   tsx scripts/shoot-zight-image.ts <zight-url> <slug>
 */
async function main() {
  const url = process.argv[2];
  const slug = process.argv[3];
  if (!url || !slug) {
    console.error("usage: tsx scripts/shoot-zight-image.ts <zight-url> <slug>");
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
    const project = await store.getProject(slug);
    if (!project) throw new Error(`no project ${slug}`);

    const existing = project.images.filter(
      (img) => !img.src.includes("placeholder")
    );

    let images = project.images;
    if (existing.length === 0) {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(1200);
      const imageUrl = await page.evaluate(
        () =>
          document
            .querySelector('meta[property="og:image"]')
            ?.getAttribute("content") || null
      );
      if (!imageUrl) throw new Error("no og:image on page");

      const resp = await context.request.get(imageUrl);
      if (!resp.ok()) throw new Error(`image fetch failed: ${resp.status()}`);
      const savedSrc = await store.saveImage(
        slug,
        "screenshot.png",
        await resp.body()
      );
      images = [{ src: savedSrc, alt: `${project.title} screenshot` }];
    }

    // Drop the misclassified video link (only if it's this Zight URL).
    const links = { ...project.links };
    let droppedLink = false;
    if (links.video === url) {
      delete links.video;
      droppedLink = true;
    }

    await store.upsertProject({ ...project, images, links });

    console.log(
      `✓ ${slug}: ${existing.length ? "kept existing screenshot" : "set screenshot from Zight image"}` +
        `${droppedLink ? ", removed video link" : ""}`
    );
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
