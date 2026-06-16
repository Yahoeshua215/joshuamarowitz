"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { categoryColor } from "@/components/globe/orbits";
import type { Project } from "@/lib/store/types";
import { MISSIONS } from "./landing-data";
import { MissionToggle } from "./mission-toggle";

export type MissionLaunch = { href: string; label: string; color: string };

/**
 * One face of the flip card: a complete mission panel (the lightweight toggle
 * with its own mission active, kicker, description, and launch CTA), tinted to
 * the face's mission. Clicking the other label calls onChange, which flips the
 * card to that mission's face.
 */
function MissionFace({
  faceKey,
  onChange,
  onLaunch,
}: {
  faceKey: Project["category"];
  onChange: (key: Project["category"]) => void;
  onLaunch?: (mission: MissionLaunch) => void;
}) {
  const mission = MISSIONS.find((m) => m.key === faceKey) ?? MISSIONS[0];
  const color = categoryColor(faceKey);
  const href = `/orbit?focus=${faceKey}`;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-3">
      <MissionToggle activeKey={faceKey} onChange={onChange} />

      {/* Description copy (left-aligned), then the bullet kicker (centered)
          below it — sitting just above the CTA. */}
      <div className="px-1">
        <p className="min-h-[3.5rem] text-[12.5px] leading-relaxed text-white/65">
          {mission.description}
        </p>
        <p
          className="mt-2.5 text-center font-mono text-[10px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: `${color}cc` }}
        >
          {mission.blurb}
        </p>
      </div>

      {/* Neutral glass-morphic Go button spanning the bottom of the panel. */}
      <Link
        href={href}
        onClick={(e) => {
          if (onLaunch && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
            e.preventDefault();
            onLaunch({ href, label: mission.label, color });
          }
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="group relative mt-0.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/[0.025] px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md transition-colors hover:bg-white/[0.06] hover:text-white"
      >
        {/* Streaking hairline border, tinted to the mission color. */}
        <span aria-hidden className="tab-streak" style={{ "--c": color } as CSSProperties} />
        Explore
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

/**
 * The mission panel. Selecting the other mission via the toggle swaps the
 * card's content in place (no flip).
 */
export function MissionSwitch({
  value,
  onChange,
  onLaunch,
}: {
  value: Project["category"];
  onChange: (key: Project["category"]) => void;
  onLaunch?: (mission: MissionLaunch) => void;
}) {
  return <MissionFace faceKey={value} onChange={onChange} onLaunch={onLaunch} />;
}
