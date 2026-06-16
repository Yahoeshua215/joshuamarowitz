import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(3000);
  const info = await page.evaluate(() => {
    const grid = document.querySelector(".landing-grid") as HTMLElement | null;
    if (!grid) return { error: "no grid" };
    const cs = getComputedStyle(grid);
    const out: Record<string, unknown> = { rows: cs.gridTemplateRows, align: cs.alignItems };
    for (const c of Array.from(grid.children)) {
      const el = c as HTMLElement;
      const area = getComputedStyle(el).gridArea.split(" ")[0];
      const r = el.getBoundingClientRect();
      const card = el.lastElementChild as HTMLElement;
      const cr = card.getBoundingClientRect();
      out[area] = {
        itemH: Math.round(r.height),
        itemBottom: Math.round(r.bottom),
        cardH: Math.round(cr.height),
        cardBottom: Math.round(cr.bottom),
      };
    }
    return out;
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
