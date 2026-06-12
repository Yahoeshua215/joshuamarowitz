import { spawn, ChildProcess } from "child_process";
import fs from "fs/promises";
import path from "path";
import { chromium, Page } from "playwright";
import { FileContentStore } from "../src/lib/store/file-store";
import { inferMediaType } from "../src/lib/media";
import { getTourTarget, TourStep, TOUR_TARGETS } from "./tours";

const HOME = process.env.HOME ?? "/Users/joshuamarowitz";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runStep(page: Page, step: TourStep, baseUrl: string) {
  switch (step.action) {
    case "goto": {
      const url = step.url.startsWith("http") ? step.url : `${baseUrl}${step.url}`;
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      break;
    }
    case "wait":
      await sleep(step.ms);
      break;
    case "scroll":
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "smooth" }), step.y);
      await sleep(800);
      break;
    case "click":
      await page.click(step.selector, { timeout: 5000 });
      break;
    case "clickOptional":
      try {
        await page.click(step.selector, { timeout: 3000 });
      } catch {
        // optional step
      }
      break;
    case "type":
      await page.fill(step.selector, step.text);
      break;
    case "press":
      await page.keyboard.press(step.key);
      break;
    case "pressRepeated":
      for (let i = 0; i < step.count; i++) {
        await page.keyboard.press(step.key);
        await sleep(step.intervalMs ?? 200);
      }
      break;
  }
}

async function captureTour(
  slug: string,
  store: FileContentStore
): Promise<boolean> {
  const target = getTourTarget(slug);
  if (!target) {
    console.warn(`No tour recipe for slug: ${slug}`);
    return false;
  }

  const projectPath = path.join(HOME, target.folder);
  try {
    await fs.access(projectPath);
  } catch {
    console.warn(`Skipping ${slug}: folder not found at ${projectPath}`);
    return false;
  }

  const videoDir = path.join(process.cwd(), ".tmp", "videos", slug);
  await fs.mkdir(videoDir, { recursive: true });

  let child: ChildProcess | null = null;

  try {
    child = spawn(target.command, target.args, {
      cwd: projectPath,
      stdio: "ignore",
      env: { ...process.env, PORT: String(target.port) },
    });

    const baseUrl = `http://localhost:${target.port}`;
    await sleep(target.waitMs ?? 6000);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      recordVideo: {
        dir: videoDir,
        size: { width: 1440, height: 900 },
      },
    });
    const page = await context.newPage();

    try {
      for (const step of target.steps) {
        await runStep(page, step, baseUrl);
      }

      await sleep(500);
    } catch (error) {
      console.warn(
        `Tour steps failed for ${slug}:`,
        error instanceof Error ? error.message : error
      );
    } finally {
      await page.close();
      await context.close();
      await browser.close();
    }

    const files = await fs.readdir(videoDir);
    const webmFile = files.find((f) => f.endsWith(".webm"));
    if (!webmFile) {
      console.warn(`No video file produced for ${slug}`);
      return false;
    }

    const sourcePath = path.join(videoDir, webmFile);
    const buffer = await fs.readFile(sourcePath);
    const src = await store.saveImage(slug, "preview.webm", buffer);

    const project = await store.getProject(slug);
    if (project) {
      const staticImages = project.images.filter(
        (img) => inferMediaType(img.src) === "image" && !img.src.includes("placeholder")
      );
      const videoEntry = {
        src,
        alt: `${project.title} preview tour`,
        type: "video" as const,
      };

      await store.upsertProject({
        ...project,
        images: [videoEntry, ...staticImages],
      });
    }

    await fs.rm(videoDir, { recursive: true, force: true });
    console.log(`✓ Captured tour for ${slug}`);
    return true;
  } finally {
    child?.kill("SIGTERM");
  }
}

async function main() {
  const onlySlug = process.argv[2];
  const store = new FileContentStore();
  const targets = onlySlug
    ? TOUR_TARGETS.filter((t) => t.slug === onlySlug)
    : TOUR_TARGETS.filter((t) =>
        ["puttmaps", "dad-jokes-directory", "zaxxon"].includes(t.slug)
      );

  if (targets.length === 0) {
    console.error(`No tour target found for slug: ${onlySlug}`);
    process.exit(1);
  }

  console.log(`Capturing ${targets.length} project tours...`);

  let success = 0;
  for (const target of targets) {
    const ok = await captureTour(target.slug, store);
    if (ok) success += 1;
  }

  console.log(`\nTour capture complete: ${success}/${targets.length} succeeded`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
