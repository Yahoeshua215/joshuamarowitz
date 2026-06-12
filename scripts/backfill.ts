import fs from "fs/promises";
import path from "path";
import { FileContentStore } from "../src/lib/store/file-store";
import { ProjectInput } from "../src/lib/store/types";
import { slugify } from "../src/lib/utils";
import { scanHomeDirectory } from "./inventory";

const HOME = process.env.HOME ?? "/Users/joshuamarowitz";

type SeedConfig = {
  folderName: string;
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  status: "shipped" | "prototype" | "experiment";
  category?: "personal" | "onesignal";
  featured?: boolean;
  caseStudy?: {
    problem: string;
    solution: string;
    outcome: string;
  };
};

const CURATED: SeedConfig[] = [
  {
    folderName: "puttreviews",
    slug: "puttmaps",
    title: "PuttMaps",
    summary:
      "Nationwide mini-golf course directory with geo-organized browse, maps, travel guides, and data pipelines for scraping and enrichment.",
    tags: ["Next.js", "Directory", "Maps", "Supabase", "SEO"],
    status: "shipped",
    featured: true,
    caseStudy: {
      problem:
        "Mini-golf travelers lack a single, trustworthy directory to discover courses by city, compare features, and plan trips.",
      solution:
        "Built a Next.js directory with state/city/zip navigation, Leaflet maps, featured listings, blog content, and Supabase-backed data migration tooling.",
      outcome:
        "A shippable geo-directory foundation with SEO-ready pages and repeatable scrape-to-publish workflows for ongoing content growth.",
    },
  },
  {
    folderName: "Metabolic",
    slug: "metabolic-intelligence",
    title: "Metabolic Intelligence Platform",
    summary:
      "Topic-first metabolic health knowledge platform with curated experts, consensus summaries, hybrid search, and an admin publishing workflow.",
    tags: ["Next.js", "Health", "Knowledge Base", "AI", "Supabase"],
    status: "prototype",
    featured: true,
    caseStudy: {
      problem:
        "Metabolic health information is fragmented across podcasts, papers, and social posts with no structured way to compare expert consensus.",
      solution:
        "Designed a topic-first platform with YAML seed content, hybrid FTS + vector search, expert profiles, and an /admin editor for publishing.",
      outcome:
        "An MVP knowledge base that works offline from seeds and can scale into a full editorial platform once Supabase is connected.",
    },
  },
  {
    folderName: "siggy",
    slug: "siggy",
    title: "Siggy — OneSignal Slack Bot",
    summary:
      "Natural-language Slack assistant that drives OneSignal push operations through OpenAI and the OneSignal MCP.",
    tags: ["AI", "Slack", "MCP", "OneSignal", "Bot"],
    status: "prototype",
    featured: true,
    caseStudy: {
      problem:
        "Product and growth teams need to act on push notification data quickly, but OneSignal workflows often require switching contexts and learning dashboard navigation.",
      solution:
        "Built Siggy, a Slack bot that interprets plain-English requests and executes OneSignal actions via MCP — send notifications, list segments, query stats.",
      outcome:
        "A working prototype demonstrating how AI agents can collapse operational distance between conversation and product tooling.",
    },
  },
  {
    folderName: "nightowls",
    slug: "night-owl-eats",
    title: "Night Owl Eats",
    summary:
      "Late-night restaurant directory organized by state, city, and neighborhood with verified hours and feature filters like open after midnight.",
    tags: ["Next.js", "Directory", "Restaurants", "Supabase", "SEO"],
    status: "shipped",
  },
  {
    folderName: "dad-jokes-directory",
    slug: "dad-jokes-directory",
    title: "Dad Jokes Directory",
    summary:
      "Searchable, categorized dad joke directory with topic packs, joke-of-the-day, and AI enrichment tooling for content expansion.",
    tags: ["Next.js", "Directory", "Humor", "SEO"],
    status: "shipped",
  },
  {
    folderName: "fasting-app",
    slug: "fasting-tracker",
    title: "Fasting Tracker",
    summary:
      "Physiology-aware intermittent fasting companion with timer, protocol tracking, phase visualization, and local-first IndexedDB persistence.",
    tags: ["React", "Vite", "Health", "PWA"],
    status: "prototype",
  },
  {
    folderName: "fitness-app",
    slug: "fitness-app",
    title: "Fitness App",
    summary:
      "Personal training tool with workout logging, CSV/XLSX import, gym management, equipment browser, and Supabase auth.",
    tags: ["React", "Vite", "Fitness", "Supabase"],
    status: "prototype",
  },
  {
    folderName: "push-website",
    slug: "notifyall",
    title: "NotifyAll",
    summary:
      "Marketing site for a multi-vertical push notification product with vertical-specific use cases and a phone mockup simulator.",
    tags: ["React", "Vite", "Marketing", "Push Notifications"],
    status: "prototype",
  },
  {
    folderName: "JoshGym",
    slug: "josh-gym",
    title: "Josh's Gym",
    summary:
      "Luxury fitness studio landing page with hero, classes, memberships, and an AI concierge modal.",
    tags: ["React", "Vite", "Fitness", "Landing Page"],
    status: "prototype",
  },
  {
    folderName: "zaxxon",
    slug: "zaxxon",
    title: "Zaxxon",
    summary:
      "Browser-based 2.5D isometric space shooter inspired by the arcade classic, built with Three.js.",
    tags: ["Three.js", "Game", "WebGL"],
    status: "experiment",
  },
  {
    folderName: "code-game",
    slug: "journey-to-sun",
    title: "Journey to the Sun",
    summary:
      "3D solar-system exploration game where players hop between planets from Neptune toward the Sun, built with React Three Fiber.",
    tags: ["Next.js", "Three.js", "Game", "3D"],
    status: "experiment",
  },
  {
    folderName: "Moto",
    slug: "moto-wheel",
    title: "Moto Wheel — Exploded View",
    summary:
      "Blender Python project that procedurally builds and renders an exploded motorcycle front wheel assembly.",
    tags: ["Blender", "Python", "3D", "Visualization"],
    status: "experiment",
  },
  {
    folderName: "unicorn-flight",
    slug: "unicorn-flight",
    title: "Unicorn Flight",
    summary:
      "Retro side-scrolling shooter with a pastel fantasy aesthetic — a rider on a flying unicorn battles killer clouds and dragon bosses across three levels.",
    tags: ["JavaScript", "Canvas", "Game", "HTML"],
    status: "prototype",
  },
  {
    folderName: "dashboard-template-sandbox",
    slug: "dashboard-template",
    title: "Dashboard Template Sandbox",
    summary:
      "Minimal production-ready dashboard boilerplate built with React, Vite, and Tailwind CSS for rapid UI prototyping.",
    tags: ["React", "Vite", "Tailwind", "Dashboard"],
    status: "shipped",
  },
  {
    folderName: "Automated-Projects",
    slug: "coda-portfolio",
    title: "Coda Case Study Portfolio",
    summary:
      "Dynamic Next.js portfolio that pulls product design case studies from Coda with Apple-inspired layout and canvas image support.",
    tags: ["Next.js", "Coda", "Portfolio", "Design"],
    status: "prototype",
  },
  {
    folderName: "Goals",
    slug: "goals-app",
    title: "Goals App",
    summary:
      "Full-stack goals tracker with a Node/Express API and React frontend for setting and monitoring personal objectives.",
    tags: ["React", "Node.js", "Express", "Full Stack"],
    status: "experiment",
  },
  {
    folderName: "PhillyWeather",
    slug: "philly-weather",
    title: "Philly Weather",
    summary:
      "iOS weather app for Philadelphia with a TikTok-style Vibes feed — vertical video posts of local weather reactions with immersive playback.",
    tags: ["iOS", "SwiftUI", "Weather", "Video"],
    status: "prototype",
  },
  {
    folderName: "Josh Vision Weather App",
    slug: "josh-vision-weather",
    title: "Josh Vision Weather",
    summary:
      "visionOS weather exploration with RealityKit 3D scenes and an immersive space toggle for spatial weather visualization.",
    tags: ["visionOS", "SwiftUI", "RealityKit", "Weather"],
    status: "experiment",
  },
  {
    folderName: "Snow",
    slug: "snow-vision",
    title: "Snow",
    summary:
      "visionOS starter exploring immersive spaces with RealityKit — toggle into a spatial snow scene from a 3D model preview.",
    tags: ["visionOS", "SwiftUI", "RealityKit", "3D"],
    status: "experiment",
  },
  {
    folderName: "Wild Card Game",
    slug: "wild-card-game",
    title: "Wild Card Game",
    summary:
      "SwiftUI card war game — flip cards against the CPU, track scores, and play through a polished arcade-style interface.",
    tags: ["iOS", "SwiftUI", "Game"],
    status: "experiment",
  },
  {
    folderName: "TicTactToe",
    slug: "tic-tac-toe",
    title: "Tic-Tac-Toe",
    summary:
      "Classic tic-tac-toe rebuilt in SwiftUI as a quick AI-assisted iOS experiment.",
    tags: ["iOS", "SwiftUI", "Game"],
    status: "experiment",
  },
  {
    folderName: "Maro Practice",
    slug: "maro-practice",
    title: "Maro Practice",
    summary:
      "SwiftUI practice app for experimenting with layouts, animations, and iOS interaction patterns.",
    tags: ["iOS", "SwiftUI", "Practice"],
    status: "experiment",
  },
  {
    folderName: "downton",
    slug: "downton-abbey-trivia",
    title: "Downton Abbey Trivia",
    summary:
      "Playful SwiftUI app that generates random Downton Abbey trivia questions on demand.",
    tags: ["iOS", "SwiftUI", "Trivia"],
    status: "experiment",
  },
  {
    folderName: "Inspiration",
    slug: "inspiration-vision",
    title: "Inspiration",
    summary:
      "visionOS exploration app scaffold with RealityKit content packages for spatial UI experiments.",
    tags: ["visionOS", "SwiftUI", "RealityKit"],
    status: "experiment",
  },
  {
    folderName: "agent-skills",
    slug: "agent-skills",
    title: "OneSignal Agent Skills",
    summary:
      "Agent skills, MCP server, and workspace configuration for OneSignal engineering teams — modular expertise for Claude, Cursor, and other coding agents.",
    tags: ["AI", "MCP", "Agent Skills", "Developer Tools"],
    status: "shipped",
    category: "onesignal",
  },
  {
    folderName: "Dogfooding-Push",
    slug: "dogfooding-push",
    title: "Dogfooding Push",
    summary:
      "iOS app for dogfooding OneSignal push notifications — test delivery, payloads, and in-app handling on real devices.",
    tags: ["iOS", "Push Notifications", "OneSignal", "Dogfooding"],
    status: "prototype",
    category: "onesignal",
  },
  {
    folderName: "OneSignal-Push_preview",
    slug: "push-preview-ios",
    title: "Push Preview iOS",
    summary:
      "iOS prototype for previewing push notification appearance and payload rendering before sending campaigns.",
    tags: ["iOS", "Push Notifications", "Preview", "OneSignal"],
    status: "prototype",
    category: "onesignal",
  },
  {
    folderName: "Pushfooding",
    slug: "pushfooding",
    title: "Pushfooding",
    summary:
      "OneSignal push testing app with notification service extension for validating rich push and delivery flows.",
    tags: ["iOS", "Push Notifications", "OneSignal", "NSE"],
    status: "prototype",
    category: "onesignal",
  },
  {
    folderName: "sdk-test-app",
    slug: "sdk-test-app",
    title: "SDK Test App",
    summary:
      "Minimal iOS harness for validating OneSignal SDK integration, initialization, and subscription flows.",
    tags: ["iOS", "SDK", "OneSignal", "Testing"],
    status: "experiment",
    category: "onesignal",
  },
  {
    folderName: "sdktest-2",
    slug: "onesignal-demo-ios",
    title: "OneSignal Demo iOS",
    summary:
      "OneSignal SDK demo app with launchpad onboarding patterns for testing mobile push setup end-to-end.",
    tags: ["iOS", "SDK", "OneSignal", "Onboarding"],
    status: "experiment",
    category: "onesignal",
  },
  {
    folderName: "OS-Preview-push",
    slug: "os-preview-push",
    title: "OS Preview Push",
    summary:
      "iOS sandbox for previewing OneSignal push creative and validating notification presentation on device.",
    tags: ["iOS", "Push Notifications", "Preview", "OneSignal"],
    status: "experiment",
    category: "onesignal",
  },
];

async function getGitDate(dirPath: string): Promise<string | null> {
  try {
    const { execSync } = await import("child_process");
    const output = execSync('git log --reverse --format="%aI" | head -1', {
      cwd: dirPath,
      stdio: ["ignore", "pipe", "ignore"],
    }).toString().trim();
    return output || null;
  } catch {
    return null;
  }
}

async function copyPreviewIfExists(
  folderName: string,
  slug: string,
  store: FileContentStore
) {
  const candidates = [
    path.join(HOME, folderName, "exploded_preview.png"),
    path.join(HOME, folderName, "public", "og-image.png"),
    path.join(HOME, folderName, "public", "preview.png"),
    path.join(HOME, folderName, "screenshot.png"),
  ];

  for (const candidate of candidates) {
    try {
      const buffer = await fs.readFile(candidate);
      const filename = path.basename(candidate);
      const src = await store.saveImage(slug, filename, buffer);
      return [{ src, alt: `${slug} preview` }];
    } catch {
      // try next
    }
  }

  return [{ src: "/placeholder.svg", alt: "Preview coming soon" }];
}

async function buildSeed(
  config: SeedConfig,
  inventoryDates: { createdAt: string; modifiedAt: string },
  store: FileContentStore
): Promise<ProjectInput> {
  const dirPath = path.join(HOME, config.folderName);
  const gitDate = await getGitDate(dirPath);
  const dateStart = (gitDate ?? inventoryDates.createdAt).slice(0, 10);
  const dateEnd = inventoryDates.modifiedAt.slice(0, 10);
  const images = await copyPreviewIfExists(config.folderName, config.slug, store);

  return {
    slug: config.slug,
    title: config.title,
    category: config.category ?? "personal",
    tags: config.tags,
    dateStart,
    dateEnd,
    summary: config.summary,
    status: config.status,
    images,
    caseStudy: config.caseStudy,
    featured: config.featured ?? false,
    order: config.featured ? 10 : 0,
    sourcePath: dirPath,
  };
}

async function getFolderDates(dirPath: string) {
  const stat = await fs.stat(dirPath);
  return {
    createdAt: stat.birthtime.toISOString(),
    modifiedAt: stat.mtime.toISOString(),
  };
}

async function main() {
  const store = new FileContentStore();
  const inventory = await scanHomeDirectory();
  const inventoryMap = new Map(inventory.map((item) => [item.name, item]));

  let created = 0;

  for (const config of CURATED) {
    const dirPath = path.join(HOME, config.folderName);
    const item = inventoryMap.get(config.folderName);
    const dates = item
      ? { createdAt: item.createdAt, modifiedAt: item.modifiedAt }
      : await getFolderDates(dirPath).catch(() => ({
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
        }));

    const seed = await buildSeed(config, dates, store);
    const existing = await store.getProject(config.slug);
    if (existing?.embedUrl) seed.embedUrl = existing.embedUrl;
    if (existing?.links && Object.keys(existing.links).length > 0) {
      seed.links = { ...existing.links, ...seed.links };
    }

    await store.upsertProject(seed);
    created += 1;
    console.log(`✓ ${seed.title}`);
  }

  // Add any additional runnable personal projects from last year not in curated list
  const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
  const curatedFolders = new Set(CURATED.map((c) => c.folderName));

  for (const item of inventory) {
    if (curatedFolders.has(item.name)) continue;
    if (new Date(item.modifiedAt).getTime() < oneYearAgo) continue;
    if (item.name.match(/OneSignal|Journey|Event|Goals|OS-|Audit|A:b|Hackathon|Figma|Content-Intel|Kayak|DWR|Nov25|Pre-builts|RBAC|segments|onboarding|push-preview|sdk-test|Visnic|UX-research|UXEs|playground|template|vibing|dashboard|agent-skills|backend|bin|myenv|AndroidStudio|Developer|Personal-vault|Automated-Projects/i)) {
      continue;
    }

    const slug = slugify(item.packageName ?? item.name);
    const existing = await store.getProject(slug);
    if (existing) continue;

    const gitDate = await getGitDate(item.path);
    const images = await copyPreviewIfExists(item.name, slug, store);

    await store.upsertProject({
      slug,
      title: item.packageName ?? item.name,
      category: "personal",
      tags: [item.inferredType.replace(/-/g, " ")],
      dateStart: (gitDate ?? item.createdAt).slice(0, 10),
      dateEnd: item.modifiedAt.slice(0, 10),
      summary:
        item.description ??
        `Personal ${item.inferredType.replace(/-/g, " ")} project built with AI-assisted development.`,
      status: "experiment",
      images,
      featured: false,
      order: 0,
      sourcePath: item.path,
    });

    created += 1;
    console.log(`+ ${item.name}`);
  }

  console.log(`\nBackfill complete: ${created} projects written`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
