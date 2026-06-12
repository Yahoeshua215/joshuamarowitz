"use client";

import { ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getHeroMedia, inferMediaType } from "@/lib/media";
import { Project } from "@/lib/store/types";
import { categoryLabel, formatDateRange } from "@/lib/utils";
import { CaseStudy } from "./case-study";
import { ImageCarousel } from "./image-carousel";
import { StatusBadge } from "./status-badge";
import { TagChip } from "./tag-chip";

const linkLabels: Record<string, string> = {
  live: "Live",
  github: "GitHub",
  video: "Video",
  figma: "Figma",
};

export function TimelineItem({ project }: { project: Project }) {
  const dateLabel = formatDateRange(project.dateStart, project.dateEnd);
  const hero = getHeroMedia(project.images);
  const hasVideo =
    hero !== null &&
    (hero.type === "video" || inferMediaType(hero.src) === "video");

  return (
    <article className="group relative grid grid-cols-[88px_1fr] gap-4 md:grid-cols-[120px_1fr]">
      <div className="pt-1 text-right">
        <time className="text-xs font-medium text-muted">{dateLabel}</time>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-foreground/15">
        <details>
          <summary className="flex cursor-pointer items-start gap-3 px-4 py-4">
            <ChevronRight className="chevron mt-0.5 h-4 w-4 shrink-0 text-muted transition-transform duration-200" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-medium tracking-tight">
                  {project.title}
                </h2>
                <StatusBadge status={project.status} />
                {hasVideo && (
                  <span className="rounded-full border border-accent/30 bg-accent-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-accent">
                    Walkthrough
                  </span>
                )}
                <span className="rounded-full border border-border px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted">
                  {categoryLabel(project.category)}
                </span>
              </div>
              <p className="text-sm text-muted">{project.summary}</p>
              {project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <TagChip key={tag} label={tag} />
                  ))}
                </div>
              )}
            </div>
          </summary>

          <div className="space-y-5 border-t border-border px-4 py-5 pl-11">
            {project.links && Object.keys(project.links).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(project.links).map(([key, url]) =>
                  url ? (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover"
                    >
                      {linkLabels[key] ?? key}
                      <ExternalLink className="h-3 w-3 text-muted" />
                    </a>
                  ) : null
                )}
              </div>
            )}

            {project.caseStudy && <CaseStudy caseStudy={project.caseStudy} />}

            {project.caseStudy && (
              <Link
                href={`/projects/${project.slug}`}
                className="inline-flex text-xs font-medium text-accent transition-colors hover:text-foreground"
              >
                Read full case study →
              </Link>
            )}
          </div>
        </details>

        {/* Always visible — walkthroughs shouldn't require expanding */}
        <div className="border-t border-border px-4 py-4">
          <ImageCarousel images={project.images} title={project.title} />
        </div>
      </div>
    </article>
  );
}
