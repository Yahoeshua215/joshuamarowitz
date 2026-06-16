import fs from "fs/promises";
import { FileContentStore } from "../src/lib/store/file-store";

/**
 * Attach a local image file as a project's screenshot, mirroring
 * shoot-dribbble.ts but sourcing the bytes from disk instead of a URL.
 *
 *   tsx scripts/attach-local-image.ts <file-path> <slug>
 */
async function main() {
  const filePath = process.argv[2];
  const slug = process.argv[3];
  if (!filePath || !slug) {
    console.error("usage: tsx scripts/attach-local-image.ts <file-path> <slug>");
    process.exit(1);
  }

  const store = new FileContentStore();
  const buffer = await fs.readFile(filePath);
  const savedSrc = await store.saveImage(slug, "screenshot.png", buffer);

  const project = await store.getProject(slug);
  if (!project) throw new Error(`no project for slug "${slug}"`);

  const rest = project.images.filter(
    (img) => !img.src.includes("placeholder") && img.src !== savedSrc
  );
  await store.upsertProject({
    ...project,
    images: [{ src: savedSrc, alt: `${project.title} screenshot` }, ...rest],
  });

  console.log(`✓ Attached ${filePath} → ${slug}: ${savedSrc}`);
}

main().catch((error) => {
  console.error("✗", error instanceof Error ? error.message : error);
  process.exit(1);
});
