import { Project } from "@/lib/store/types";

export type MissionCategory = {
  key: Project["category"];
  label: string;
  blurb: string;
};

// Maps the three landing entry points onto the existing satellite categories.
export const MISSIONS: MissionCategory[] = [
  {
    key: "personal",
    label: "Personal AI Projects",
    blurb: "Apps, games, and experiments I build for myself.",
  },
  {
    key: "onesignal",
    label: "Work-Related AI Projects",
    blurb: "AI prototypes and tools built around OneSignal.",
  },
  {
    key: "onesignal-work",
    label: "OneSignal Product Releases",
    blurb: "Shipped product design work across the platform.",
  },
];

// Cycled through the scramble/decrypt ticker in the toolkit.
export const SCRAMBLE_TOOLS: string[] = [
  "CLAUDE",
  "CODEX",
  "CLAUDE CODE",
  "CHATGPT",
  "V0",
  "CURSOR",
  "VERTEX",
  "GEMINI",
  "NOTEBOOKLM",
  "MIXPANEL",
  "HIGHTOUCH",
  "CENSUS",
  "REACT",
  "REACT FLOW",
  "HIGHCHARTS",
  "HTML",
  "CSS",
  "STORYBOOK",
  "ALL MODELS",
  "MCP",
  "SKILLS",
  "TERMINAL",
  "CLI",
  "LINEAR",
  "ASANA",
  "POSTHOG",
  "HOTJAR",
  "INTERCOM",
  "FIGMA",
  "ADOBE",
  "PRODUCTBOARD",
  "GRANOLA",
  "CODA",
  "SUPABASE",
  "GITHUB",
  "VERCEL",
  "SLACK",
  "COWORK",
];

// Slow "credits" scroll of disciplines and capabilities.
export const CREDITS_SKILLS: string[] = [
  "Product Design",
  "Product Management",
  "Prototyping",
  "Design Systems",
  "UX Research",
  "Interaction & Motion",
  "3D / WebGL",
  "Frontend Engineering",
  "AI Agents",
  "Prompt Engineering",
  "Rapid Iteration",
  "Design Engineering",
];

export const BIO: string[] = [
  "I'm currently working at the edge of what the design role can be. I run the full product surface, from research and synthesis to prototyping, design, and customer discovery, using AI as the connective tissue across all of it.",
  "I sit across multiple teams, which means I'm often the thread connecting product vision to design execution, and the person who sees around corners before the handoff ever happens.",
  "My practice is built around flattening the triad. It's less about wearing every hat and more about dissolving the seams between them. Highly collaborative by nature, I work best embedded in the mess of it, bridging strategy, craft, and velocity all at once.",
];

export const NAME = "Joshua Marowitz";
export const ROLE = "Staff Product Designer · AI Practitioner";
export const CURRENT = "currently at onesignal.com";

// Proficiency bars (bottom-left "system stats")
export type CoreStat = { label: string; value: number };
export const CORE_STATS: CoreStat[] = [
  { label: "Design", value: 0.94 },
  { label: "Engineering", value: 0.82 },
  { label: "AI / Agents", value: 0.9 },
];

// Skill stat bars shown beside the toolkit (weapon-stat style)
export const SKILL_STATS: CoreStat[] = [
  { label: "Prototyping", value: 0.95 },
  { label: "Design Systems", value: 0.88 },
  { label: "Interaction & Motion", value: 0.8 },
  { label: "UX Research", value: 0.72 },
];

// Capability tiles (the "abilities" grid)
export type Capability = { label: string; icon: "design" | "code" | "ai" | "3d" };
export const CAPABILITIES: Capability[] = [
  { label: "Product Design", icon: "design" },
  { label: "Frontend Eng", icon: "code" },
  { label: "AI Agents", icon: "ai" },
  { label: "3D / WebGL", icon: "3d" },
];
