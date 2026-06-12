import fs from "fs/promises";
import path from "path";

const OUT_DIR = path.join(process.cwd(), "public", "textures");

const BASE =
  "https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/textures/planets";

const TEXTURES: { url: string; file: string }[] = [
  { url: `${BASE}/earth_atmos_2048.jpg`, file: "earth_day.jpg" },
  { url: `${BASE}/earth_normal_2048.jpg`, file: "earth_normal.jpg" },
  { url: `${BASE}/earth_specular_2048.jpg`, file: "earth_specular.jpg" },
  { url: `${BASE}/earth_clouds_1024.png`, file: "earth_clouds.png" },
  { url: `${BASE}/earth_lights_2048.png`, file: "earth_night.jpg" },
];

async function download(url: string, dest: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} for ${url}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(dest, buffer);
  return buffer.length;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  let ok = 0;
  for (const { url, file } of TEXTURES) {
    const dest = path.join(OUT_DIR, file);
    try {
      const bytes = await download(url, dest);
      console.log(`✓ ${file} (${(bytes / 1024).toFixed(0)} KB)`);
      ok += 1;
    } catch (error) {
      console.warn(
        `✗ ${file}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  console.log(`\nFetched ${ok}/${TEXTURES.length} textures into public/textures`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
