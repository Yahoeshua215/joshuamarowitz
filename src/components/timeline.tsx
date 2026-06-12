"use client";

import { useMemo, useState } from "react";
import { Project } from "@/lib/store/types";
import { CategoryFilter, filterProjects, getAllTags } from "@/lib/utils";
import { TimelineFilters } from "./timeline-filters";
import { TimelineItem } from "./timeline-item";

export function Timeline({ projects }: { projects: Project[] }) {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const tagSource = useMemo(() => {
    if (category === "personal") return [];
    if (category === "all") return projects;
    return projects.filter((p) => p.category === category);
  }, [projects, category]);

  const tags = useMemo(() => getAllTags(tagSource), [tagSource]);

  const filtered = useMemo(
    () => filterProjects(projects, category, activeTags),
    [projects, category, activeTags]
  );

  const handleTagToggle = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="space-y-8">
      <TimelineFilters
        category={category}
        onCategoryChange={(value) => {
          setCategory(value);
          setActiveTags([]);
        }}
        tags={tags}
        activeTags={activeTags}
        onTagToggle={handleTagToggle}
        showTags={category !== "personal"}
      />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted">
          No projects match these filters yet.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((project) => (
            <TimelineItem key={project.slug} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
