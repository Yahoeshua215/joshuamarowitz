export type TourStep =
  | { action: "goto"; url: string }
  | { action: "wait"; ms: number }
  | { action: "scroll"; y: number }
  | { action: "click"; selector: string }
  | { action: "clickOptional"; selector: string }
  | { action: "type"; selector: string; text: string }
  | { action: "press"; key: string }
  | { action: "pressRepeated"; key: string; count: number; intervalMs?: number };

export type TourTarget = {
  slug: string;
  folder: string;
  port: number;
  command: string;
  args: string[];
  waitMs?: number;
  steps: TourStep[];
};

export const TOUR_TARGETS: TourTarget[] = [
  {
    slug: "puttmaps",
    folder: "puttreviews",
    port: 3010,
    command: "npm",
    args: ["run", "dev", "--", "-p", "3010"],
    waitMs: 8000,
    steps: [
      { action: "goto", url: "/" },
      { action: "wait", ms: 2000 },
      { action: "scroll", y: 600 },
      { action: "wait", ms: 1500 },
      { action: "goto", url: "/florida" },
      { action: "wait", ms: 2000 },
      { action: "scroll", y: 500 },
      { action: "wait", ms: 1500 },
      { action: "clickOptional", selector: 'a[href*="/florida/"]' },
      { action: "wait", ms: 2000 },
      { action: "scroll", y: 800 },
      { action: "wait", ms: 1500 },
    ],
  },
  {
    slug: "metabolic-intelligence",
    folder: "Metabolic",
    port: 3013,
    command: "npm",
    args: ["run", "dev", "--", "-p", "3013"],
    waitMs: 8000,
    steps: [
      { action: "goto", url: "/" },
      { action: "wait", ms: 2000 },
      {
        action: "type",
        selector: 'input[placeholder*="Ask about fasting"]',
        text: "berberine insulin",
      },
      { action: "wait", ms: 2000 },
      { action: "goto", url: "/topics" },
      { action: "wait", ms: 2000 },
      { action: "scroll", y: 400 },
      { action: "wait", ms: 1500 },
      { action: "clickOptional", selector: 'a[href^="/topics/"]' },
      { action: "wait", ms: 2500 },
      { action: "scroll", y: 500 },
      { action: "wait", ms: 1500 },
      { action: "goto", url: "/experts" },
      { action: "wait", ms: 2000 },
      { action: "clickOptional", selector: 'a[href^="/experts/"]' },
      { action: "wait", ms: 2000 },
    ],
  },
  {
    slug: "dad-jokes-directory",
    folder: "dad-jokes-directory",
    port: 3012,
    command: "npm",
    args: ["run", "dev", "--", "-p", "3012"],
    waitMs: 8000,
    steps: [
      { action: "goto", url: "/" },
      { action: "wait", ms: 1500 },
      { action: "type", selector: 'input[placeholder="Search jokes..."]', text: "pizza" },
      { action: "wait", ms: 2000 },
      { action: "clickOptional", selector: 'a[href*="/joke/"]' },
      { action: "wait", ms: 1500 },
      { action: "goto", url: "/funny" },
      { action: "wait", ms: 2000 },
      { action: "scroll", y: 600 },
      { action: "wait", ms: 1500 },
      { action: "clickOptional", selector: 'a[href*="/joke/"]' },
      { action: "wait", ms: 2000 },
    ],
  },
  {
    slug: "zaxxon",
    folder: "zaxxon",
    port: 3018,
    command: "npm",
    args: ["run", "dev", "--", "--port", "3018"],
    waitMs: 5000,
    steps: [
      { action: "goto", url: "/" },
      { action: "wait", ms: 2000 },
      { action: "clickOptional", selector: "#game-container" },
      { action: "pressRepeated", key: "ArrowRight", count: 10, intervalMs: 200 },
      { action: "pressRepeated", key: "ArrowUp", count: 8, intervalMs: 200 },
      { action: "wait", ms: 2000 },
      { action: "pressRepeated", key: "Space", count: 8, intervalMs: 300 },
      { action: "pressRepeated", key: "KeyE", count: 6, intervalMs: 250 },
      { action: "wait", ms: 2000 },
    ],
  },
  {
    slug: "night-owl-eats",
    folder: "nightowls",
    port: 3011,
    command: "npm",
    args: ["run", "dev", "--", "-p", "3011"],
    waitMs: 8000,
    steps: [
      { action: "goto", url: "/" },
      { action: "wait", ms: 2000 },
      { action: "scroll", y: 500 },
      { action: "wait", ms: 1500 },
      { action: "goto", url: "/new-york" },
      { action: "wait", ms: 2000 },
      { action: "scroll", y: 600 },
      { action: "wait", ms: 1500 },
      { action: "clickOptional", selector: 'a[href*="/new-york/"]' },
      { action: "wait", ms: 2000 },
    ],
  },
  {
    slug: "fasting-tracker",
    folder: "fasting-app",
    port: 3014,
    command: "npm",
    args: ["run", "dev", "--", "--port", "3014"],
    waitMs: 5000,
    steps: [
      { action: "goto", url: "/" },
      { action: "wait", ms: 2000 },
      { action: "clickOptional", selector: 'button:has-text("Set the clock")' },
      { action: "wait", ms: 2500 },
      { action: "click", selector: 'a[href="/protocols"]' },
      { action: "wait", ms: 2000 },
      { action: "scroll", y: 500 },
      { action: "wait", ms: 1500 },
      { action: "click", selector: 'a[href="/progress"]' },
      { action: "wait", ms: 2500 },
      { action: "scroll", y: 400 },
      { action: "wait", ms: 1500 },
      { action: "click", selector: 'a[href="/learn"]' },
      { action: "wait", ms: 2000 },
      { action: "clickOptional", selector: "article button" },
      { action: "wait", ms: 2000 },
      { action: "click", selector: 'a[href="/"]' },
      { action: "wait", ms: 2000 },
    ],
  },
  {
    slug: "notifyall",
    folder: "push-website",
    port: 3016,
    command: "npm",
    args: ["run", "dev", "--", "--port", "3016"],
    waitMs: 5000,
    steps: [
      { action: "goto", url: "/" },
      { action: "wait", ms: 1500 },
      { action: "scroll", y: 700 },
      { action: "wait", ms: 1500 },
      { action: "scroll", y: 1400 },
      { action: "wait", ms: 1500 },
      { action: "scroll", y: 2100 },
      { action: "wait", ms: 2000 },
    ],
  },
  {
    slug: "josh-gym",
    folder: "JoshGym",
    port: 3017,
    command: "npm",
    args: ["run", "dev", "--", "--port", "3017"],
    waitMs: 5000,
    steps: [
      { action: "goto", url: "/" },
      { action: "wait", ms: 1500 },
      { action: "scroll", y: 700 },
      { action: "wait", ms: 1500 },
      { action: "scroll", y: 1400 },
      { action: "wait", ms: 1500 },
      { action: "clickOptional", selector: 'button:has-text("Concierge"), button:has-text("concierge")' },
      { action: "wait", ms: 2000 },
    ],
  },
];

export function getTourTarget(slug: string): TourTarget | undefined {
  return TOUR_TARGETS.find((target) => target.slug === slug);
}
