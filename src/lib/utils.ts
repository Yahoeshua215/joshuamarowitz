import { Project } from "./store/types";

export type CategoryFilter = "all" | Project["category"];

export const CATEGORY_LABELS: Record<Project["category"], string> = {
  personal: "Personal",
  onesignal: "OneSignal AI",
  "onesignal-work": "OneSignal Projects",
};

export function categoryLabel(category: Project["category"]): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function formatDateRange(
  dateStart: string,
  dateEnd: string | "ongoing"
): string {
  const start = new Date(dateStart);
  const startLabel = start.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  if (dateEnd === "ongoing") {
    return `${startLabel} — ongoing`;
  }

  const end = new Date(dateEnd);
  const endLabel = end.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  if (startLabel === endLabel) return startLabel;
  return `${startLabel} — ${endLabel}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getAllTags(projects: Project[]): string[] {
  const tags = new Set<string>();
  for (const project of projects) {
    for (const tag of project.tags) tags.add(tag);
  }
  return Array.from(tags).sort();
}

export function filterProjects(
  projects: Project[],
  category: CategoryFilter,
  activeTags: string[]
): Project[] {
  return projects.filter((project) => {
    if (category !== "all" && project.category !== category) return false;
    if (activeTags.length === 0) return true;
    return activeTags.every((tag) => project.tags.includes(tag));
  });
}
