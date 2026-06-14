import { chromium } from "playwright";
import { FileContentStore } from "../src/lib/store/file-store";

/**
 * Capture a single still frame from a hosted video (e.g. a Zight share link)
 * and attach it as a project's screenshot. Loads the page, finds the <video>,
 * seeks to a representative moment, pauses, and screenshots the video element
 * (no player chrome) — no ffmpeg required.
 *
 *   tsx scripts/shoot-video-frame.ts <video-page-url> <slug> [seekFraction]
 *
 * seekFraction (0–1, default 0.4) picks how far into the clip to grab the frame.
 */
async function main() {
  const url = process.argv[2];
  const slug = process.argv[3];
  const seekFraction = process.argv[4] ? Number(process.argv[4]) : 0.4;

  if (!url || !slug) {
    console.error(
      "usage: tsx scripts/shoot-video-frame.ts <video-page-url> <slug> [seekFraction]"
    );
    process.exit(1);
  }

  const store = new FileContentStore();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    locale: "en-US",
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });

    const video = page.locator("video").first();
    await video.waitFor({ state: "attached", timeout: 30000 });

    // The on-page player loads the CDN media without CORS, so its frames taint
    // the canvas. Re-load the same source in a fresh crossOrigin video (the CDN
    // sends Access-Control-Allow-Origin: *), seek, and draw — clean pixels, no
    // player chrome.
    const src = await video.evaluate(
      (el: HTMLVideoElement) => el.currentSrc || el.src
    );
    if (!src) throw new Error("no video source found on page");

    const dataUrl = await page.evaluate(
      async (args: { src: string; fraction: number }) => {
        const el = document.createElement("video");
        el.crossOrigin = "anonymous";
        el.muted = true;
        el.preload = "auto";
        el.src = args.src;

        await new Promise<void>((resolve) => {
          if (el.readyState >= 1 && el.videoWidth > 0) return resolve();
          el.addEventListener("loadedmetadata", () => resolve(), { once: true });
          setTimeout(() => resolve(), 15000);
        });

        const duration = Number.isFinite(el.duration) ? el.duration : 0;
        const target = duration > 0 ? duration * args.fraction : 2;

        await new Promise<void>((resolve) => {
          el.addEventListener("seeked", () => resolve(), { once: true });
          el.currentTime = target;
          setTimeout(() => resolve(), 12000);
        });
        await new Promise((r) => setTimeout(r, 300));

        const canvas = document.createElement("canvas");
        canvas.width = el.videoWidth || 1440;
        canvas.height = el.videoHeight || 900;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/png");
      },
      { src, fraction: seekFraction }
    );

    if (!dataUrl) throw new Error("could not draw video frame to canvas");
    const buffer = Buffer.from(dataUrl.split(",")[1], "base64");
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

    console.log(`✓ Saved video frame for ${slug}: ${savedSrc}`);
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
