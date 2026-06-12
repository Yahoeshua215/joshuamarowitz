import { execSync } from "child_process";
import fs from "fs/promises";
import path from "path";

const ROOT = process.cwd();
const EMBED_PUBLIC = path.join(ROOT, "public", "embeds");
const CONTENT_DIR = path.join(ROOT, "content", "projects");

type EmbedTarget = {
  slug: string;
  /** Absolute path to the project source on disk. */
  sourcePath: string;
  /**
   * Build command run inside `sourcePath`. Must emit a static site with
   * relative asset paths into `outDir` (the script passes it via env OUT_DIR).
   * Defaults to a Vite static build with a relative base.
   */
  build?: (outDir: string) => string;
};

// Projects whose static build can be embedded as a live, interactive iframe.
// They must be client-only (no server) — local storage / IndexedDB is fine.
const TARGETS: EmbedTarget[] = [
  {
    slug: "fasting-tracker",
    sourcePath: "/Users/joshuamarowitz/fasting-app",
  },
];

function defaultBuild(outDir: string) {
  return `npx vite build --base=./ --outDir "${outDir}" --emptyOutDir`;
}

async function buildOne(target: EmbedTarget) {
  const outDir = path.join(EMBED_PUBLIC, target.slug);

  console.log(`\n▶ Building embed: ${target.slug}`);
  console.log(`  source: ${target.sourcePath}`);

  try {
    await fs.access(target.sourcePath);
  } catch {
    console.warn(`  ✗ source not found, skipping`);
    return false;
  }

  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });

  const command = (target.build ?? defaultBuild)(outDir);
  execSync(command, { cwd: target.sourcePath, stdio: "inherit" });

  const entryPath = path.join(CONTENT_DIR, target.slug, "entry.json");
  const entry = JSON.parse(await fs.readFile(entryPath, "utf-8"));
  entry.embedUrl = `/embeds/${target.slug}/index.html`;
  await fs.writeFile(entryPath, `${JSON.stringify(entry, null, 2)}\n`, "utf-8");

  console.log(`  ✓ ${target.slug} → ${entry.embedUrl}`);
  return true;
}

async function main() {
  const only = process.argv[2];
  const targets = only
    ? TARGETS.filter((t) => t.slug === only)
    : TARGETS;

  if (targets.length === 0) {
    console.log(
      only
        ? `No embed target named "${only}".`
        : "No embed targets configured."
    );
    return;
  }

  let built = 0;
  for (const target of targets) {
    if (await buildOne(target)) built += 1;
  }

  console.log(`\nBuilt ${built}/${targets.length} embeds.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
