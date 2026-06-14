// Structured form of the weekly work log (parsed from content/weekly-log.md),
// shaped for the "operator's log" HUD: a list of dated entries, each carrying a
// few markdown lines that may contain outbound links.

export type LogLine = {
  /** Bolded lead-in, e.g. "Events", "Journey Goals". Empty for plain notes. */
  topic: string;
  /** The remainder of the bullet, as markdown (preserves [text](url) links). */
  body: string;
  /** Whether the original bullet was a soft note (italic, no topic). */
  note: boolean;
};

export type LogWeek = {
  /** Stable id, e.g. "2025-06-02". */
  id: string;
  /** Human label, e.g. "Week of Jun 6, 2026". */
  label: string;
  /** ISO start date (week Monday-ish), e.g. "2025-06-02". */
  start: string;
  /** ISO end date, e.g. "2025-06-06". */
  end: string;
  /** Calendar year of the entry. */
  year: number;
  /** Quarter bucket, e.g. "2025 Q2" — used for range filtering. */
  period: string;
  /** Optional one-line theme (from a "**Theme: …**" line). */
  theme?: string;
  /** Optional parenthetical header note, e.g. "Short week, Thu–Fri only". */
  aside?: string;
  /** Flavor stardate, derived from the start date. */
  stardate: string;
  /** The logged lines for the week. */
  lines: LogLine[];
};
