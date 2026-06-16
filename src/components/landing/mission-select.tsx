"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { categoryColor } from "@/components/globe/orbits";
import type { Project } from "@/lib/store/types";
import { MISSIONS } from "./landing-data";

export type MissionLaunch = { href: string; label: string; color: string };

/**
 * A small animated orbit marker: a glowing core orb circled by a satellite on a
 * tilted elliptical ring — a miniature preview of the orbit screen, used in
 * place of a plain bullet beside each segment label.
 */
function MissionOrb({ color, active }: { color: string; active: boolean }) {
  return (
    <span
      aria-hidden
      className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center transition-opacity"
      style={{ opacity: active ? 1 : 0.55 }}
    >
      {/* Tilted orbital plane (squashed to an ellipse). */}
      <span className="absolute inset-0" style={{ transform: "scaleY(0.42)" }}>
        <span
          className="absolute inset-0 rounded-full border"
          style={{ borderColor: `${color}66` }}
        />
        {/* Satellite circling the ring — only spins on the selected segment. */}
        <span className={`absolute inset-0 ${active ? "mission-orb-spin" : ""}`}>
          <span
            className="absolute left-1/2 top-0 h-[3px] w-[3px] -translate-x-1/2 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }}
          />
        </span>
      </span>
      {/* Core orb (kept circular — outside the squashed plane). */}
      <span
        className="h-[7px] w-[7px] rounded-full"
        style={{
          backgroundColor: color,
          boxShadow: active ? `0 0 7px ${color}` : `0 0 4px ${color}80`,
        }}
      />
    </span>
  );
}

/**
 * One face of the flip card: a complete mission panel (segmented control with
 * its own mission active, kicker, description, and launch CTA), tinted to the
 * face's mission. Clicking the other segment calls onChange, which flips the
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
  const faceIndex = MISSIONS.findIndex((m) => m.key === faceKey);

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-3"
      style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,0.07), 0 0 24px ${color}14` }}
    >
      {/* Segmented control — this face's mission is the active segment. */}
      <div
        role="tablist"
        aria-label="Select a mission"
        className="relative grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/25 p-1"
      >
        <span
          aria-hidden
          className="absolute inset-y-1 left-1 w-[calc(50%-0.375rem)] rounded-lg"
          style={{
            transform: faceIndex === 1 ? "translateX(calc(100% + 0.25rem))" : "translateX(0)",
            background: `linear-gradient(180deg, ${color}33, ${color}1a)`,
            border: `1px solid ${color}80`,
            boxShadow: `0 0 16px ${color}40, inset 0 1px 0 rgba(255,255,255,0.12)`,
          }}
        />
        {MISSIONS.map((m) => {
          const on = m.key === faceKey;
          const c = categoryColor(m.key);
          return (
            <button
              key={m.key}
              type="button"
              role="tab"
              aria-selected={on}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onChange(m.key)}
              className={`relative z-10 flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-[12px] font-semibold tracking-tight transition-colors ${
                on ? "text-white" : "text-white/50 hover:text-white/80"
              }`}
            >
              <MissionOrb color={c} active={on} />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Kicker + fuller description (centered). */}
      <div className="px-1 text-center">
        <p
          className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: `${color}cc` }}
        >
          {mission.blurb}
        </p>
        <p className="mt-1.5 min-h-[3.5rem] text-[12.5px] leading-relaxed text-white/65">
          {mission.description}
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
        className="group mt-0.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.025] px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md transition-colors hover:bg-white/[0.06] hover:text-white"
      >
        Explore
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

/**
 * The mission panel as a flip card. The front face is the first mission, the
 * back face the second; selecting the other segment spins the whole card 180°
 * on its Y axis so the chosen mission's panel reads as the back of the card.
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
  const flipped = value === MISSIONS[1]?.key;

  return (
    <div className="mission-flip">
      <div className={`mission-flip-inner ${flipped ? "is-flipped" : ""}`}>
        <div
          className="mission-flip-face"
          style={{ pointerEvents: flipped ? "none" : "auto" }}
          aria-hidden={flipped}
        >
          <MissionFace faceKey={MISSIONS[0].key} onChange={onChange} onLaunch={onLaunch} />
        </div>
        <div
          className="mission-flip-face mission-flip-back"
          style={{ pointerEvents: flipped ? "auto" : "none" }}
          aria-hidden={!flipped}
        >
          <MissionFace faceKey={MISSIONS[1].key} onChange={onChange} onLaunch={onLaunch} />
        </div>
      </div>
    </div>
  );
}
