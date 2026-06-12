import fs from "fs/promises";
import path from "path";

const HOME = process.env.HOME ?? "/Users/joshuamarowitz";

const SKIP_DIRS = new Set([
  ".Trash",
  "Applications",
  "Desktop",
  "Documents",
  "Downloads",
  "Library",
  "Movies",
  "Music",
  "Pictures",
  "Public",
  "Sites",
  "node_modules",
  ".git",
  ".cursor",
  ".claude",
  ".config",
  ".npm",
  ".nvm",
  "Josh-log",
  "tmp-app",
]);

export type InventoryItem = {
  name: string;
  path: string;
  hasPackageJson: boolean;
  hasReadme: boolean;
  packageName?: string;
  description?: string;
  dependencies: string[];
  devDependencies: string[];
  scripts: string[];
  modifiedAt: string;
  createdAt: string;
  runnable: boolean;
  inferredType: string;
};

async function exists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function getDirDates(dirPath: string) {
  const stat = await fs.stat(dirPath);
  return {
    modifiedAt: stat.mtime.toISOString(),
    createdAt: stat.birthtime.toISOString(),
  };
}

function inferType(deps: string[], name: string): string {
  if (deps.includes("three") || deps.includes("@react-three/fiber")) return "game";
  if (deps.includes("next")) return "nextjs-directory";
  if (deps.includes("vite") || deps.includes("react-router-dom")) return "react-app";
  if (deps.includes("@slack/bolt")) return "slack-bot";
  if (name.toLowerCase().includes("blender") || name === "Moto") return "3d-visualization";
  return "project";
}

export async function scanHomeDirectory(home = HOME): Promise<InventoryItem[]> {
  const entries = await fs.readdir(home, { withFileTypes: true });
  const items: InventoryItem[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) continue;

    const dirPath = path.join(home, entry.name);
    const hasPackageJson = await exists(path.join(dirPath, "package.json"));
    const hasReadme = await exists(path.join(dirPath, "README.md"));
    const hasIndexHtml = await exists(path.join(dirPath, "index.html"));
    const hasXcodeProject = (await fs.readdir(dirPath)).some((name) =>
      name.endsWith(".xcodeproj")
    );

    if (!hasPackageJson && !hasReadme && !hasIndexHtml && !hasXcodeProject) continue;

    let packageName: string | undefined;
    let description: string | undefined;
    let dependencies: string[] = [];
    let devDependencies: string[] = [];
    let scripts: string[] = [];

    if (hasPackageJson) {
      try {
        const pkg = JSON.parse(
          await fs.readFile(path.join(dirPath, "package.json"), "utf-8")
        );
        packageName = pkg.name;
        description = pkg.description;
        dependencies = Object.keys(pkg.dependencies ?? {});
        devDependencies = Object.keys(pkg.devDependencies ?? {});
        scripts = Object.keys(pkg.scripts ?? {});
      } catch {
        // ignore malformed package.json
      }
    }

    const dates = await getDirDates(dirPath);
    const runnable =
      scripts.includes("dev") ||
      scripts.includes("start") ||
      scripts.includes("preview");

    items.push({
      name: entry.name,
      path: dirPath,
      hasPackageJson,
      hasReadme,
      packageName,
      description,
      dependencies,
      devDependencies,
      scripts,
      modifiedAt: dates.modifiedAt,
      createdAt: dates.createdAt,
      runnable,
      inferredType: inferType([...dependencies, ...devDependencies], entry.name),
    });
  }

  return items.sort(
    (a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
  );
}

async function main() {
  const items = await scanHomeDirectory();
  console.log(JSON.stringify(items, null, 2));
  console.error(`\nFound ${items.length} candidate projects`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
