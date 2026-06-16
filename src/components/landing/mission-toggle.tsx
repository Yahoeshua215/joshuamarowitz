"use client";

import type { CSSProperties } from "react";
import { categoryColor } from "@/components/globe/orbits";
import type { Project } from "@/lib/store/types";
import { MISSIONS } from "./landing-data";

/**
 * Lightweight mission toggle: two plain text labels with a soft glowing
 * underline marking the active mission. No pills or boxes. Clicking the inactive
 * label calls onChange, which swaps the mission card's content to that mission.
 */
export function MissionToggle({
  activeKey,
  onChange,
}: {
  activeKey: Project["category"];
  onChange: (key: Project["category"]) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Select a mission"
      className="flex items-center justify-center gap-7"
    >
      {MISSIONS.map((m) => {
        const on = m.key === activeKey;
        const c = categoryColor(m.key);
        return (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={on}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onChange(m.key)}
            className="group relative whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-semibold tracking-tight transition-colors"
          >
            {/* Active: hairline bottom stroke with a tracer pinging left↔right. */}
            {on && (
              <span
                aria-hidden
                className="tab-underline"
                style={{ "--c": c } as CSSProperties}
              />
            )}
            <span
              className={`relative ${on ? "text-white" : "text-white/40 group-hover:text-white/70"}`}
            >
              {m.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
