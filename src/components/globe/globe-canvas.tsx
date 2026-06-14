"use client";

import dynamic from "next/dynamic";
import { LogWeek } from "@/lib/log/types";
import { Project } from "@/lib/store/types";

const GlobeScene = dynamic(() => import("./globe-scene"), {
  ssr: false,
  // Starfield hold (matches the launch transition + the in-scene curtain) so
  // the stars never blank before the globe paints.
  loading: () => (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#05070d]">
      <div className="space-layer space-stars space-stars-1" />
      <div className="space-layer space-stars space-stars-2" />
      <div className="space-layer space-stars space-stars-3" />
    </div>
  ),
});

export function GlobeCanvas({
  projects,
  logWeeks = [],
  initialFocus = null,
}: {
  projects: Project[];
  logWeeks?: LogWeek[];
  initialFocus?: Project["category"] | null;
}) {
  return (
    <GlobeScene
      projects={projects}
      logWeeks={logWeeks}
      initialFocus={initialFocus}
    />
  );
}
