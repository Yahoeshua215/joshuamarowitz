import { readFile } from "node:fs/promises";
import path from "node:path";
import { LogLine, LogWeek } from "./types";

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// Dated-post header, e.g. "## Jun 6, 2026" — one entry per weekly #design post.
const HEADER_RE = /^([A-Za-z]+)\s+(\d+),\s*(\d{4})\b/;

function iso(year: number, monthAbbr: string, day: number): string {
  const m = MONTHS[monthAbbr.toLowerCase().slice(0, 3)] ?? 0;
  const mm = String(m + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

// Light flavor: a monotonically increasing "stardate" derived from the post
// date so the log reads like a ship's log without pretending to be precise.
function stardateFor(dateIso: string): string {
  const d = new Date(`${dateIso}T00:00:00Z`).getTime();
  const epoch = new Date("2025-01-01T00:00:00Z").getTime();
  const days = (d - epoch) / 86_400_000;
  return (41000 + days * 2.74).toFixed(1);
}

function parseLine(raw: string): LogLine {
  const text = raw.replace(/^[-*]\s+/, "").trim();

  // Bolded lead-in: **Topic** — body
  const bold = text.match(/^\*\*(.+?)\*\*\s*[—-]\s*(.*)$/);
  if (bold) {
    return { topic: bold[1].trim(), body: bold[2].trim(), note: false };
  }

  // Plain Slack lead-in: "Topic — body". Only promote the lead to a callsign
  // when it's short and free of markup (links/bold), so sentences that merely
  // contain an em dash — or whose lead carries a link — render as plain body.
  const dash = text.match(/^([^—]{1,42})\s—\s(.+)$/);
  if (dash && !/[[\]()*]/.test(dash[1])) {
    return { topic: dash[1].trim(), body: dash[2].trim(), note: false };
  }

  // A purely italic aside, e.g. "*Note: …*"
  const italic = text.match(/^\*(.+)\*$/);
  if (italic) {
    return { topic: "", body: italic[1].trim(), note: true };
  }

  return { topic: "", body: text, note: false };
}

function parseEntry(block: string): LogWeek | null {
  const lines = block.split("\n");
  const headerLine = lines[0].trim();
  const m = headerLine.match(HEADER_RE);
  if (!m) return null;

  const [, month, day, yearStr] = m;
  const year = Number(yearStr);
  const date = iso(year, month, Number(day));
  const label = `Week of ${month} ${day}, ${year}`;

  const monthIdx = MONTHS[month.toLowerCase().slice(0, 3)] ?? 0;
  const quarter = Math.floor(monthIdx / 3) + 1;

  const logLines: LogLine[] = [];
  for (const rawLine of lines.slice(1)) {
    const line = rawLine.trim();
    if (!line || line === "---") continue;
    if (line.startsWith("- ")) logLines.push(parseLine(line));
  }

  if (logLines.length === 0) return null;

  return {
    id: date,
    label,
    start: date,
    end: date,
    year,
    period: `${year} Q${quarter}`,
    stardate: stardateFor(date),
    lines: logLines,
  };
}

let cache: LogWeek[] | null = null;

/**
 * Reads and parses the #design channel weekly update log into structured,
 * newest-first entries. Sourced from `design-channel-updates.md` in the project
 * root. Server-only (touches the filesystem); cached for the process lifetime.
 */
export async function loadWeeklyLog(): Promise<LogWeek[]> {
  if (cache) return cache;

  const file = path.join(process.cwd(), "design-channel-updates.md");
  const md = await readFile(file, "utf8");

  // Each entry is a "## <date>" section.
  const blocks = md.split(/^##\s+/m).slice(1);
  const entries = blocks
    .map(parseEntry)
    .filter((w): w is LogWeek => w !== null)
    .sort((a, b) => (a.start < b.start ? 1 : -1)); // newest first

  cache = entries;
  return entries;
}
