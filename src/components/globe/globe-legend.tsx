"use client";

import { MISSION_CATEGORY_ORDER } from "@/components/landing/landing-data";
import { Project } from "@/lib/store/types";
import { categoryLabel } from "@/lib/utils";
import { categoryColor } from "./orbits";

export function GlobeLegend({
  count,
  active,
  onToggle,
}: {
  count: number;
  active: Set<Project["category"]>;
  onToggle: (category: Project["category"]) => void;
}) {
  return (
    <div className="absolute bottom-4 left-4 z-10 max-w-[min(15rem,calc(100vw-2rem))] select-none font-mono text-[11px] uppercase tracking-[0.15em] text-white/70 sm:bottom-5 sm:left-5">
      <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 backdrop-blur-sm sm:px-4 sm:py-3">
        <p className="mb-2 text-white/50">{count} satellites in orbit</p>
        <div className="space-y-1.5">
          {MISSION_CATEGORY_ORDER.map((category) => (
            <LegendRow
              key={category}
              color={categoryColor(category)}
              label={categoryLabel(category)}
              on={active.has(category)}
              onClick={() => onToggle(category)}
            />
          ))}
        </div>
        <p className="mt-2.5 text-[10px] normal-case tracking-normal text-white/40">
          Select a row to filter · select a satellite for details
        </p>
      </div>
    </div>
  );
}

function LegendRow({
  color,
  label,
  on,
  onClick,
}: {
  color: string;
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-opacity hover:bg-white/5 ${
        on ? "opacity-100" : "opacity-35"
      }`}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={
          on
            ? { backgroundColor: color, boxShadow: `0 0 6px ${color}` }
            : { backgroundColor: "transparent", border: `1px solid ${color}` }
        }
      />
      <span className="flex-1">{label}</span>
    </button>
  );
}
