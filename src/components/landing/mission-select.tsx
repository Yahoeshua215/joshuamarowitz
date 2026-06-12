"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { categoryColor } from "@/components/globe/orbits";
import { MISSIONS } from "./landing-data";

export type MissionLaunch = { href: string; label: string; color: string };

export function MissionSelect({
  onLaunch,
}: {
  onLaunch?: (mission: MissionLaunch) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {MISSIONS.map((mission, i) => {
        const color = categoryColor(mission.key);
        const href = `/orbit?focus=${mission.key}`;
        return (
          <Link
            key={mission.key}
            href={href}
            onClick={(e) => {
              // Let the parent play the "pivot to orbit" transition before
              // navigating. Modifier-clicks / middle-clicks keep native behavior.
              if (onLaunch && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                onLaunch({ href, label: mission.label, color });
              }
            }}
            className="mission-card group flex items-center gap-4 rounded-lg p-3.5 text-left backdrop-blur-sm"
            style={{ "--c": color } as React.CSSProperties}
          >
            <span className="mission-index font-mono text-base font-semibold tabular-nums leading-none">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold leading-tight tracking-tight text-white">
                {mission.label}
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-white/55">
                {mission.blurb}
              </span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/25 transition-all group-hover:translate-x-0.5 group-hover:[color:var(--c)]" />
          </Link>
        );
      })}
    </div>
  );
}
