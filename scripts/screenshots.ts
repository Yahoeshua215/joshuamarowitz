import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { chromium } from "playwright";
import { FileContentStore } from "../src/lib/store/file-store";

const HOME = process.env.HOME ?? "/Users/joshuamarowitz";

type ScreenshotTarget = {
  slug: string;
  folder: string;
  port: number;
  command: string;
  args: string[];
  url?: string;
  waitMs?: number;
};

const TARGETS: ScreenshotTarget[] = [
  {
    slug: "puttmaps",
    folder: "puttreviews",
    port: 3010,
    command: "npm",
    args: ["run", "dev", "--", "-p", "3010"],
    waitMs: 8000,
  },
  {
    slug: "night-owl-eats",
    folder: "nightowls",
    port: 3011,
    command: "npm",
    args: ["run", "dev", "--", "-p", "3011"],
    waitMs: 8000,
  },
  {
    slug: "dad-jokes-directory",
    folder: "dad-jokes-directory",
    port: 3012,
    command: "npm",
    args: ["run", "dev", "--", "-p", "3012"],
    waitMs: 8000,
  },
  {
    slug: "metabolic-intelligence",
    folder: "Metabolic",
    port: 3013,
    command: "npm",
    args: ["run", "dev", "--", "-p", "3013"],
    waitMs: 8000,
  },
  {
    slug: "fasting-tracker",
    folder: "fasting-app",
    port: 3014,
    command: "npm",
    args: ["run", "dev", "--", "--port", "3014"],
    waitMs: 5000,
  },
  {
    slug: "fitness-app",
    folder: "fitness-app",
    port: 3015,
    command: "npm",
    args: ["run", "dev", "--", "--port", "3015"],
    waitMs: 5000,
  },
  {
    slug: "notifyall",
    folder: "push-website",
    port: 3016,
    command: "npm",
    args: ["run", "dev", "--", "--port", "3016"],
    waitMs: 5000,
  },
  {
    slug: "josh-gym",
    folder: "JoshGym",
    port: 3017,
    command: "npm",
    args: ["run", "dev", "--", "--port", "3017"],
    waitMs: 5000,
  },
  {
    slug: "zaxxon",
    folder: "zaxxon",
    port: 3018,
    command: "npm",
    args: ["run", "dev", "--", "--port", "3018"],
    waitMs: 5000,
  },
  {
    slug: "space-shooter",
    folder: "space-shooter",
    port: 3019,
    command: "python3",
    args: ["-m", "http.server", "3019"],
    waitMs: 3000,
  },
  {
    slug: "onesiggy-game",
    folder: "Onesiggy-game",
    port: 3020,
    command: "npm",
    args: ["run", "dev", "--", "--port", "3020"],
    waitMs: 6000,
  },
  {
    slug: "os-gamey",
    folder: "OS-Gamey",
    port: 3021,
    command: "npm",
    args: ["run", "dev", "--", "--port", "3021"],
    waitMs: 6000,
  },
  {
    slug: "unicorn-flight",
    folder: "unicorn-flight",
    port: 3022,
    command: "python3",
    args: ["-m", "http.server", "3022"],
    waitMs: 3000,
  },
  {
    slug: "dashboard-template",
    folder: "dashboard-template-sandbox",
    port: 3023,
    command: "python3",
    args: ["-m", "http.server", "3023", "--directory", "dist"],
    waitMs: 3000,
  },
  {
    slug: "coda-portfolio",
    folder: "Automated-Projects",
    port: 3024,
    command: "npm",
    args: ["run", "dev", "--", "-p", "3024"],
    waitMs: 8000,
  },
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureTarget(target: ScreenshotTarget, store: FileContentStore) {
  const projectPath = path.join(HOME, target.folder);

  try {
    await fs.access(projectPath);
  } catch {
    console.warn(`Skipping ${target.slug}: folder not found`);
    return false;
  }

  const child = spawn(target.command, target.args, {
    cwd: projectPath,
    stdio: "ignore",
    env: { ...process.env, PORT: String(target.port) },
  });

  const url = target.url ?? `http://localhost:${target.port}`;

  try {
    await sleep(target.waitMs ?? 6000);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      await sleep(1500);
      const buffer = await page.screenshot({ type: "png", fullPage: false });
      const src = await store.saveImage(target.slug, "screenshot.png", buffer);

      const project = await store.getProject(target.slug);
      if (project) {
        const images = project.images.filter((img) => !img.src.includes("placeholder"));
        await store.upsertProject({
          ...project,
          images: [...images, { src, alt: `${project.title} screenshot` }],
        });
      }

      console.log(`✓ Captured ${target.slug}`);
      return true;
    } catch (error) {
      console.warn(`✗ Failed ${target.slug}:`, error instanceof Error ? error.message : error);
      return false;
    } finally {
      await browser.close();
    }
  } finally {
    child.kill("SIGTERM");
  }
}

async function main() {
  const onlySlug = process.argv[2];
  const store = new FileContentStore();
  const targets = onlySlug
    ? TARGETS.filter((t) => t.slug === onlySlug)
    : TARGETS;

  if (targets.length === 0) {
    console.error(`No screenshot target found for slug: ${onlySlug}`);
    process.exit(1);
  }

  console.log(`Capturing ${targets.length} project screenshots...`);

  let success = 0;
  for (const target of targets) {
    const ok = await captureTarget(target, store);
    if (ok) success += 1;
  }

  console.log(`\nScreenshots complete: ${success}/${targets.length} succeeded`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
