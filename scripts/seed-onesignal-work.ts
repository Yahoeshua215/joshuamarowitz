import { FileContentStore } from "../src/lib/store/file-store";
import { ProjectInput } from "../src/lib/store/types";

type Walk = { label: string; url: string };

type WorkSeed = {
  slug: string;
  title: string;
  theme: string;
  tags: string[];
  /** "YYYY-MM" the project channel was created. */
  created: string;
  active: boolean;
  problem: string;
  role: string;
  outcome: string;
  walkthroughs: Walk[];
};

// Curated from the "Walkthrough Links by Project" section of
// josh-onesignal-projects.md — the portfolio-quality OneSignal product
// design work, each with a problem, Josh's role, and walkthrough links.
const CURATED: WorkSeed[] = [
  // ---- Journeys ----
  {
    slug: "prebuilt-journeys",
    title: "Pre-built Journeys",
    theme: "Journeys",
    tags: ["Journeys", "UX Design", "Templates", "Empty States"],
    created: "2024-01",
    active: false,
    problem:
      "Give users ready-made journey templates and an empty-state path so they aren't starting from a blank canvas.",
    role: "Designed the pre-built journey modal, empty-state cards/secondary buttons, and template-entry UX; ran bug bashes with eng.",
    outcome:
      "Shipped a guided template-entry experience that replaced the blank canvas with ready-to-use starting points.",
    walkthroughs: [
      {
        label: "Loom — thinking/vision walkthrough",
        url: "https://www.loom.com/share/e231fe274a04425d89b3f19639a78382",
      },
      { label: "Empty-state vision wire", url: "https://share.zight.com/yAuebAYy" },
      { label: "Pre-built cards exploration", url: "https://share.zight.com/RBuRlNkA" },
      { label: "Collapse / secondary-button options", url: "https://share.zight.com/GGuekYY2" },
    ],
  },
  {
    slug: "scheduling-journeys",
    title: "Scheduling Journeys",
    theme: "Journeys",
    tags: ["Journeys", "UX Design", "Scheduling", "Entitlements"],
    created: "2024-09",
    active: false,
    problem:
      "Let users schedule journey entry by date/time, including the entitlement story.",
    role: "Drove the UX flow (kickoff walkthroughs), date-picker states, and alert/status placement in the journey index.",
    outcome:
      "Defined the scheduling flow and date-picker states that let customers control when audiences enter a journey.",
    walkthroughs: [
      {
        label: "Loom — kickoff UX flow",
        url: "https://www.loom.com/share/5d6425567e3d44ee9bca25ed4cc1a8d3",
      },
      {
        label: "Loom — wire walkthrough",
        url: "https://www.loom.com/share/6ff322e553c243cd883d520c85af9391",
      },
      { label: "Date-picker disabled-state issue", url: "https://share.zight.com/L1uElNRZ" },
      { label: "Active vs. disabled select state", url: "https://share.zight.com/DOu1y26k" },
    ],
  },
  {
    slug: "multi-branching",
    title: "Multi-branching",
    theme: "Journeys",
    tags: ["Journeys", "UX Design", "Branching"],
    created: "2024-11",
    active: false,
    problem:
      "Allow journeys to split into multiple branches with even or random distribution and re-entry handling.",
    role: "Designed the branch UX flow, the \"randomize on re-entry\" toggle, even-split default, and tooltip/help copy; presented at design crit.",
    outcome:
      "Delivered a branching model with sensible defaults and re-entry handling that the team aligned on at design crit.",
    walkthroughs: [
      {
        label: "Loom — context clip for the team",
        url: "https://www.loom.com/share/a2e191c26ca34881ab6c2ca7982b2af9",
      },
      { label: "Branch flow check", url: "https://share.zight.com/wbuOyDnP" },
      { label: "Distribution UX", url: "https://share.zight.com/OAudBXD8" },
    ],
  },
  {
    slug: "wait-until-node",
    title: "Wait Until (event node)",
    theme: "Journeys",
    tags: ["Journeys", "UX Design", "Events", "Prototyping"],
    created: "2025-02",
    active: false,
    problem:
      "A \"Wait Until [event]\" node so journeys can pause for a customer action before continuing.",
    role: "Prototyped the node UI, select-menu icons/tooltips, disabled states, and engagement-qualifier pre-selection; coordinated design-eng syncs.",
    outcome:
      "Prototyped an event-aware wait node that lets journeys hold for real customer actions before proceeding.",
    walkthroughs: [
      { label: "Quick prototype walkthrough", url: "https://share.zight.com/7KulYvZd" },
      { label: "New UI working", url: "https://share.zight.com/QwurxDvE" },
      { label: "Message-selection issue", url: "https://share.zight.com/kpuxBE9k" },
      { label: "Event-list link in node", url: "https://share.zight.com/bLu2L9ON" },
    ],
  },
  {
    slug: "journey-goals",
    title: "Journey Goals",
    theme: "Journeys",
    tags: ["Journeys", "UX Design", "Analytics", "Creator"],
    created: "2025-08",
    active: false,
    problem:
      "Let users set a measurable goal (e.g., CTR/clicks) against a journey without bloating journey settings.",
    role: "Designed goal settings, reconciled metric definitions (Click vs CTR), and proposed a segmented tab component to tame the long settings panel.",
    outcome:
      "Created the journey goals settings and a segmented-tab pattern that kept a growing settings panel manageable.",
    walkthroughs: [
      { label: "Goal-in-settings concept", url: "https://share.zight.com/bLuPJ1ze" },
      { label: "\"Settings getting long\" → tabs idea", url: "https://share.zight.com/X6u6X1Zg" },
      { label: "CTR pill exploration", url: "https://share.zight.com/6qunoY2o" },
    ],
  },
  {
    slug: "journey-audience-activity",
    title: "Audience Activity for Journey Messages",
    theme: "Journeys",
    tags: ["Journeys", "UX Design", "Analytics", "Tables"],
    created: "2024-01",
    active: false,
    problem:
      "Show per-message audience activity inside journeys with consistent search/tabs/filtering.",
    role: "Designed the table, search-above-tabs pattern, and entitlement UI; pushed for consistency with the rest of the app.",
    outcome:
      "Designed a per-message activity table that brought journey analytics in line with the rest of the app.",
    walkthroughs: [
      { label: "Search/tabs behavior", url: "https://share.zight.com/7KunZl8z" },
    ],
  },

  // ---- Events & Analytics ----
  {
    slug: "event-triggers",
    title: "Event Triggers",
    theme: "Events & Analytics",
    tags: ["Events", "UX Design", "Journeys", "Creator"],
    created: "2024-12",
    active: false,
    problem:
      "Enter a journey from a custom event, including adding/editing event properties in settings.",
    role: "Owned the Event Trigger settings UX flow and explored 4 property-editing patterns (collapsible card, segment-builder, inline stream, data-tag).",
    outcome:
      "Owned the event-trigger settings flow and pressure-tested four property-editing patterns to land the strongest one.",
    walkthroughs: [
      { label: "Event Trigger UX flow", url: "https://share.zight.com/ApuolN2R" },
      { label: "4 property-editing versions", url: "https://share.zight.com/6quA8qOp" },
      { label: "Entrance-node concept", url: "https://share.zight.com/nOu4bexo" },
    ],
  },
  {
    slug: "events-index",
    title: "Events Index / Storage",
    theme: "Events & Analytics",
    tags: ["Events", "UX Design", "Analytics", "v0", "Prototyping"],
    created: "2025-04",
    active: false,
    problem:
      "A browsable event + storage index with filters, date ranges, and goals/insights.",
    role: "Prototyped the index (incl. a live v0/Vercel prototype), filters, collapse component, and an \"insights/goals\" section; partnered closely with eng.",
    outcome:
      "Prototyped a filterable events index — including a live v0 build — that framed insights and goals for the team.",
    walkthroughs: [
      { label: "Goals/insights WIP prototype", url: "https://share.zight.com/z8uWNXrG" },
      { label: "PRD-driven v0 exploration", url: "https://share.zight.com/NQum1801" },
      { label: "Filter scope", url: "https://share.zight.com/9ZuOBAbD" },
      { label: "Updated look", url: "https://share.zight.com/7Kulpm9B" },
    ],
  },
  {
    slug: "ab-testing-journeys",
    title: "A/B Testing in Journeys",
    theme: "Events & Analytics",
    tags: ["Experimentation", "UX Design", "Journeys", "Analytics", "Creator"],
    created: "2026-01",
    active: true,
    problem:
      "A/B test journeys end-to-end — authoring the test and reading results, including automatic winner selection.",
    role: "Designed both authoring and analytics, the cancel-a-live-test flow, and surfaced auto-winner selection as the top customer ask.",
    outcome:
      "Designed end-to-end A/B testing for journeys and elevated automatic winner selection as the top customer ask.",
    walkthroughs: [
      { label: "Zight — 9-min v0 UX/UI walkthrough", url: "https://share.zight.com/eDuO4PR6" },
      { label: "Early authoring wires", url: "https://share.zight.com/Apu2W0Ov" },
      { label: "Variant", url: "https://share.zight.com/p9umyDzP" },
    ],
  },

  // ---- Integrations & Data ----
  {
    slug: "data-warehouse-export",
    title: "Data Warehouse Export",
    theme: "Integrations & Data",
    tags: ["Integrations", "UX Design", "Data", "Fivetran"],
    created: "2024-02",
    active: false,
    problem:
      "Let customers export OneSignal data to their warehouse via Fivetran-powered connectors.",
    role: "Designed the connector config forms, settings/sync pages, and the message/user-events data model UI.",
    outcome:
      "Designed the connector configuration and data-model UI behind Fivetran-powered warehouse exports.",
    walkthroughs: [
      { label: "Databricks config form — first pass", url: "https://share.zight.com/Z4uEjL7e" },
      { label: "Message/user events concept", url: "https://share.zight.com/Wnu50e7b" },
    ],
  },
  {
    slug: "data-ingestion",
    title: "Data Ingestion (Sources & Destinations)",
    theme: "Integrations & Data",
    tags: ["Integrations", "UX Design", "Data"],
    created: "2024-12",
    active: false,
    problem:
      "A clear sources/destinations index for data flowing into OneSignal.",
    role: "Designed the source/destination cards, the \"OneSignal as destination\" treatment, and a source-agnostic sync index.",
    outcome:
      "Designed a source/destination model and sync index that made data flow into OneSignal legible.",
    walkthroughs: [
      { label: "Destination call-out question", url: "https://share.zight.com/P8uz0Bmn" },
      { label: "Source-row click behavior", url: "https://share.zight.com/wbudZ9Pp" },
      { label: "Preferred version", url: "https://share.zight.com/Apuo0DkX" },
    ],
  },
  {
    slug: "integrations-dashboard",
    title: "Integrations Dashboard",
    theme: "Integrations & Data",
    tags: ["Integrations", "UX Design", "Dashboards"],
    created: "2025-05",
    active: false,
    problem: "A health view across all integrations and syncs.",
    role: "Designed the source-agnostic \"sync index\" and source-health states.",
    outcome:
      "Designed a source-agnostic sync index with health states for monitoring every integration at a glance.",
    walkthroughs: [
      { label: "Sync index concept", url: "https://share.zight.com/8LuEl9NE" },
    ],
  },
  {
    slug: "user-subscription-ingestion",
    title: "User & Subscription Ingestion",
    theme: "Integrations & Data",
    tags: ["Integrations", "UX Design", "Data", "Prototyping"],
    created: "2025-09",
    active: true,
    problem:
      "Ingest users/subscriptions with visibility into sync runs and rejected records.",
    role: "Prototyped the high-level flow, \"view records\" for completed syncs, and rejected-record filtering.",
    outcome:
      "Prototyped ingestion with run-level visibility and rejected-record filtering so customers can debug syncs.",
    walkthroughs: [
      { label: "High-level flow prototype", url: "https://share.zight.com/jkuk5OAr" },
      { label: "Rejected-record filtering", url: "https://share.zight.com/E0uvkrZl" },
      { label: "View-records UX", url: "https://share.zight.com/X6u6pddK" },
    ],
  },

  // ---- AI ----
  {
    slug: "onesignal-ai",
    title: "OneSignal AI",
    theme: "AI",
    tags: ["AI", "UX Design", "MCP", "Copilot", "Creator"],
    created: "2026-02",
    active: true,
    problem:
      "An in-product AI copilot/assistant (and dashboard) for OneSignal, connected via MCP.",
    role: "Prototyped the copilot, an AI-led empty-state dashboard, the MCP-connected Slack agent, and the AskUserQuestions journey-creation pattern.",
    outcome:
      "Prototyped a OneSignal copilot, an AI-led dashboard, and an MCP-connected agent that creates journeys conversationally.",
    walkthroughs: [
      { label: "OneSignal AI agent via Slack (video)", url: "https://share.zight.com/eDuOmjxY" },
      { label: "Versions overview video", url: "https://share.zight.com/6qu4dbEn" },
      { label: "AI empty-state dashboard concept", url: "https://share.zight.com/o0udjg0w" },
      { label: "AskUserQuestions journey creation", url: "https://share.zight.com/Bluwvv4A" },
    ],
  },
  {
    slug: "ai-poc",
    title: "AI Proof-of-Concept",
    theme: "AI",
    tags: ["AI", "UX Design", "Prototyping", "Figma"],
    created: "2025-02",
    active: true,
    problem:
      "Early proof-of-concept explorations for AI across summaries, onboarding, and content generation.",
    role: "Built rapid prototypes (Cursor) and recorded ideation walkthroughs — push-notification summary → A/B, AI onboarding, insight/summary cards.",
    outcome:
      "Built rapid AI prototypes that seeded later product bets across summaries, onboarding, and content generation.",
    walkthroughs: [
      { label: "Figma wireframe — Push summary → A/B", url: "https://share.zight.com/NQumkxJw" },
      {
        label: "Loom — AI onboarding explorations",
        url: "https://www.loom.com/share/e2acfe14d88e43bc877f8de0398a1152",
      },
      { label: "Summary/insight card video", url: "https://share.zight.com/5zuRQnym" },
      { label: "V1 floating window", url: "https://share.zight.com/KouRgYDX" },
      { label: "V2 sticky footer", url: "https://share.zight.com/E0uNwR16" },
    ],
  },
  {
    slug: "mcp-banner",
    title: "MCP In-Product Banner",
    theme: "AI",
    tags: ["AI", "MCP", "UX Design", "Growth"],
    created: "2026-02",
    active: true,
    problem:
      "Promote the OneSignal MCP via an in-product banner without being intrusive.",
    role: "Directed the banner UX/design and dismissal behavior with design-eng.",
    outcome:
      "Directed a non-intrusive in-product banner that promotes the OneSignal MCP with considered dismissal behavior.",
    walkthroughs: [
      { label: "Banner dismissal/refresh check", url: "https://share.zight.com/yAuNB8A6" },
    ],
  },

  // ---- Onboarding & Growth ----
  {
    slug: "onboarding-2026",
    title: "Onboarding",
    theme: "Onboarding & Growth",
    tags: ["Onboarding", "UX Design", "Growth", "Research"],
    created: "2026-01",
    active: true,
    problem:
      "Rework the new-user signup/onboarding flow with persona paths (marketer vs engineer) and brand-asset setup.",
    role: "Designed the end-to-end onboarding flow, brand-kit setup, skip logic, and validated it via live customer calls.",
    outcome:
      "Designed a persona-aware onboarding flow with brand-kit setup, validated through live customer calls.",
    walkthroughs: [
      { label: "Onboarding flow update", url: "https://share.zight.com/qGuWQqvv" },
      { label: "Linear onboarding inspiration", url: "https://share.zight.com/nOuxv9Ap" },
    ],
  },

  // ---- Permissions, RBAC & Compliance ----
  {
    slug: "rbac-audit",
    title: "RBAC + Audit",
    theme: "Permissions & Compliance",
    tags: ["RBAC", "UX Design", "Permissions", "Compliance"],
    created: "2025-09",
    active: true,
    problem: "Role-based access control and an audit/activity log for admins.",
    role: "Designed the RBAC UI and the audit-log UI; walked stakeholders through the design.",
    outcome:
      "Designed the RBAC and audit-log interfaces and aligned stakeholders on the access model.",
    walkthroughs: [
      { label: "RBAC UX/UI", url: "https://share.zight.com/6qu44QA0" },
      { label: "Audit-log UI walkthrough", url: "https://share.zight.com/5zulJQme" },
    ],
  },
  {
    slug: "audit-logs",
    title: "Audit Logs",
    theme: "Permissions & Compliance",
    tags: ["Compliance", "UX Design", "Audit", "Prototyping"],
    created: "2025-08",
    active: true,
    problem:
      "View all-user and per-user activity for troubleshooting and compliance.",
    role: "Prototyped the all-activity and per-user activity-log views.",
    outcome:
      "Prototyped all-user and per-user activity views that support troubleshooting and compliance.",
    walkthroughs: [
      { label: "All-user activity — first pass", url: "https://share.zight.com/d5u5XoGE" },
      { label: "Specific-user activity log", url: "https://share.zight.com/5zuqKxrj" },
    ],
  },

  // ---- Messaging & Platform ----
  {
    slug: "search-experience",
    title: "Search",
    theme: "Messaging & Platform",
    tags: ["Search", "UX Design", "Messaging", "Consistency"],
    created: "2023-09",
    active: false,
    problem:
      "Consistent search/filter behavior across Push, Email, SMS, Templates, and Journeys.",
    role: "Designed search UX, empty/no-results states and copy, and documented misalignments across channels.",
    outcome:
      "Unified search and filter behavior across channels, including empty-state copy and a cross-channel audit.",
    walkthroughs: [
      { label: "Templates search + filter + tabs", url: "https://share.zight.com/z8uogzE7" },
      { label: "Search-with-labels bug", url: "https://share.zight.com/OAuZvpBB" },
    ],
  },
];

function monthBounds(created: string, active: boolean) {
  const dateStart = `${created}-01`;
  const dateEnd = active ? "ongoing" : `${created}-28`;
  return { dateStart, dateEnd };
}

function buildOutcome(seed: WorkSeed): string {
  const links = seed.walkthroughs
    .map((w) => `- [${w.label}](${w.url})`)
    .join("\n");
  return `${seed.outcome}\n\n**Walkthroughs:**\n\n${links}`;
}

async function main() {
  const store = new FileContentStore();
  let written = 0;

  for (const seed of CURATED) {
    const { dateStart, dateEnd } = monthBounds(seed.created, seed.active);
    const existing = await store.getProject(seed.slug);

    const input: ProjectInput = {
      slug: seed.slug,
      title: seed.title,
      category: "onesignal",
      tags: seed.tags,
      dateStart,
      dateEnd,
      summary: seed.problem,
      status: seed.active ? "prototype" : "shipped",
      links: {
        ...(existing?.links ?? {}),
        video: seed.walkthroughs[0]?.url,
      },
      images: existing?.images ?? [],
      caseStudy: {
        problem: seed.problem,
        solution: seed.role,
        outcome: buildOutcome(seed),
      },
      featured: false,
      order: 0,
    };

    if (existing?.embedUrl) input.embedUrl = existing.embedUrl;

    await store.upsertProject(input);
    written += 1;
    console.log(`✓ ${seed.title} (${seed.slug})`);
  }

  console.log(`\nSeed complete: ${written} OneSignal Projects written`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
