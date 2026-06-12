"use client";

import dynamic from "next/dynamic";
import { Project } from "@/lib/store/types";

const GlobeScene = dynamic(() => import("./globe-scene"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-0 flex items-center justify-center bg-[#05070d]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/60">
          Establishing orbit…
        </p>
      </div>
    </div>
  ),
});

export function GlobeCanvas({
  projects,
  initialFocus = null,
}: {
  projects: Project[];
  initialFocus?: Project["category"] | null;
}) {
  return <GlobeScene projects={projects} initialFocus={initialFocus} />;
}
