"use client";

import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { MODEL_IDLE_URL, MODEL_RUN_URL } from "./avatar-model";
import { BIO, CURRENT, NAME, ROLE } from "./landing-data";
import { MissionSelect } from "./mission-select";
import { NameScramble } from "./name-scramble";
import { SkillScramble } from "./skill-scramble";
import { SkillsCredits } from "./skills-credits";

const ACCENT = "#5ee0c8";

const LandingScene = dynamic(() => import("./landing-scene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#5ee0c8]/25 border-t-[#5ee0c8]" />
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#5ee0c8]/70">
          Booting…
        </p>
      </div>
    </div>
  ),
});

function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const base = "pointer-events-none absolute h-4 w-4 border-[#5ee0c8]/45";
  const map = {
    tl: "left-3 top-3 border-l border-t",
    tr: "right-3 top-3 border-r border-t",
    bl: "left-3 bottom-3 border-b border-l",
    br: "right-3 bottom-3 border-b border-r",
  } as const;
  return <span className={`${base} ${map[pos]}`} aria-hidden />;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-[#5ee0c8]/60">
      {children}
    </p>
  );
}

export function LandingCanvas() {
  const [running, setRunning] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLDivElement>(null);
  const nebulaRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const handleMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rotY = (px - 0.5) * 7;
      const rotX = (0.5 - py) * 5.5;
      el.style.transform = `perspective(1500px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
      const glow = glowRef.current;
      if (glow) {
        glow.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
        glow.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
        glow.style.opacity = "1";
      }
      // Parallax the space behind the modal — stars drift opposite the cursor,
      // nebulae lag (they're "farther"), selling motion through space.
      const sx = (px - 0.5) * -34;
      const sy = (py - 0.5) * -26;
      if (starsRef.current) {
        starsRef.current.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
      }
      if (nebulaRef.current) {
        nebulaRef.current.style.transform = `translate3d(${(sx * 0.4).toFixed(1)}px, ${(sy * 0.4).toFixed(1)}px, 0)`;
      }
    });
  }, []);

  const handleLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const el = panelRef.current;
    if (el) el.style.transform = "perspective(1500px) rotateX(0deg) rotateY(0deg)";
    if (glowRef.current) glowRef.current.style.opacity = "0";
    if (starsRef.current) starsRef.current.style.transform = "translate3d(0,0,0)";
    if (nebulaRef.current) nebulaRef.current.style.transform = "translate3d(0,0,0)";
  }, []);

  return (
    <div className="scifi-bg fixed inset-0 z-0 flex items-center justify-center overflow-y-auto px-4 py-8 text-white">
      {/* Drifting space backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {/* Nebulae (far layer — lags the cursor) */}
        <div
          ref={nebulaRef}
          className="absolute -inset-20 transition-transform duration-700 ease-out"
        >
          <div
            className="nebula"
            style={{
              width: 620,
              height: 480,
              left: "-8%",
              top: "2%",
              background:
                "radial-gradient(circle, rgba(94,224,200,0.5), transparent 70%)",
              animation: "nebula-float-a 90s ease-in-out infinite",
            }}
          />
          <div
            className="nebula"
            style={{
              width: 720,
              height: 540,
              right: "-12%",
              top: "26%",
              background:
                "radial-gradient(circle, rgba(242,95,76,0.42), transparent 70%)",
              animation: "nebula-float-b 120s ease-in-out infinite",
            }}
          />
          <div
            className="nebula"
            style={{
              width: 540,
              height: 420,
              left: "24%",
              bottom: "-14%",
              background:
                "radial-gradient(circle, rgba(94,224,200,0.4), transparent 70%)",
              animation: "nebula-float-a 105s ease-in-out infinite reverse",
            }}
          />
        </div>

        {/* Stars (near layer — leads the cursor parallax) */}
        <div
          ref={starsRef}
          className="absolute -inset-20 transition-transform duration-500 ease-out"
        >
          <div className="space-layer space-stars space-stars-1" />
          <div className="space-layer space-stars space-stars-2" />
          <div className="space-layer space-stars space-stars-3" />

          {/* Occasional slow shooting stars */}
          <div
            className="shooting-star"
            style={{
              top: "12%",
              left: "8%",
              animation: "shooting-star-move 19s ease-in 6s infinite",
            }}
          />
          <div
            className="shooting-star"
            style={{
              top: "44%",
              left: "38%",
              animation: "shooting-star-move 27s ease-in 16s infinite",
            }}
          />
        </div>
      </div>

      <div
        ref={panelRef}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        className="hud-panel relative z-10 w-full max-w-[60rem] rounded-2xl border border-white/15 backdrop-blur-md transition-transform duration-200 ease-out [transform:perspective(1500px)] will-change-transform"
        style={{
          background:
            "linear-gradient(155deg, rgba(255,255,255,0.09), rgba(255,255,255,0.015) 45%, rgba(94,224,200,0.045)), linear-gradient(0deg, rgba(10,14,22,0.32), rgba(10,14,22,0.32))",
          boxShadow:
            "0 0 70px rgba(94,224,200,0.1), 0 30px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.2)",
        }}
      >
        {/* Cursor-follow shine */}
        <div
          ref={glowRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 rounded-2xl opacity-0 transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(480px circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.14), rgba(94,224,200,0.07) 32%, transparent 60%)",
            mixBlendMode: "screen",
          }}
        />
        <Corner pos="tl" />
        <Corner pos="tr" />
        <Corner pos="bl" />
        <Corner pos="br" />

        {/* Header */}
        <div className="relative border-b border-white/10 px-6 py-4 sm:px-8">
          <div className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#5ee0c8]/50">
              Operator
            </p>
            <h1 className="mt-1">
              <NameScramble
                text={NAME}
                className="font-mono text-xl font-semibold uppercase tracking-[0.12em] sm:text-2xl"
              />
            </h1>
            <p
              className="mt-1 font-mono text-[11px] uppercase tracking-[0.3em]"
              style={{ color: ACCENT }}
            >
              {ROLE}
            </p>
            <p className="mt-1 text-xs lowercase tracking-wide text-white/50">
              {CURRENT}
            </p>
          </div>
          <div className="absolute right-6 top-4 hidden items-center gap-2 font-mono text-[9px] uppercase tracking-[0.25em] text-[#5ee0c8]/60 sm:flex">
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#5ee0c8]"
              style={{ boxShadow: `0 0 8px ${ACCENT}` }}
            />
            Sys · Online
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 sm:px-8">
          {/* Top row: missions/toolkit · avatar · skills — symmetric flanks,
              equal-width side tracks with the avatar centered. */}
          <div className="grid justify-center gap-5 md:grid-cols-[minmax(0,260px)_minmax(210px,240px)_minmax(0,260px)] md:items-stretch md:gap-7">
          {/* Left: missions + toolkit */}
          <div className="order-2 flex flex-col gap-5 md:order-1">
            <div>
              <Label>Select a mission</Label>
              <MissionSelect />
            </div>
            <div>
              <Label>Toolkit</Label>
              <SkillScramble />
            </div>
          </div>

          {/* Center: avatar hologram */}
          <div className="order-1 flex flex-col md:order-2">
            <Label>
              <span className="block text-center">Avatar</span>
            </Label>
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onPointerMove={(e) => e.stopPropagation()}
              className="relative w-full max-w-[240px] flex-1 min-h-[260px] cursor-grab self-center overflow-hidden rounded-xl border border-[#5ee0c8]/20 bg-gradient-to-b from-white/[0.04] to-black/30 active:cursor-grabbing"
              style={{ boxShadow: "inset 0 0 30px rgba(94,224,200,0.08)" }}
            >
              <LandingScene modelUrl={running ? MODEL_RUN_URL : MODEL_IDLE_URL} />

              {/* Targeting reticle — click to toggle run / stop */}
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setRunning((v) => !v)}
                aria-pressed={running}
                title={running ? "Stop" : "Run"}
                className="group absolute right-3 top-3 h-9 w-9 cursor-pointer rounded-full transition-transform hover:scale-110"
              >
                <span
                  className={`scifi-reticle absolute inset-0 rounded-full border ${
                    running
                      ? "border-[#5ee0c8]"
                      : "border-[#5ee0c8]/40 group-hover:border-[#5ee0c8]/80"
                  }`}
                  style={running ? { boxShadow: `0 0 10px ${ACCENT}` } : undefined}
                />
                <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#5ee0c8]/25" />
                <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#5ee0c8]/25" />
                <span
                  className={`absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity ${
                    running ? "bg-[#5ee0c8] opacity-100" : "bg-[#5ee0c8]/0 opacity-0 group-hover:bg-[#5ee0c8]/60 group-hover:opacity-100"
                  }`}
                />
              </button>

              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
                style={{
                  background: `linear-gradient(to top, ${ACCENT}1f, transparent)`,
                }}
                aria-hidden
              />
            </div>
          </div>

          {/* Right: skills */}
          <div className="order-3">
            <SkillsCredits />
          </div>
          </div>

          {/* Profile — full width below */}
          <div className="mt-6 border-t border-white/10 pt-5">
            <Label>Profile</Label>
            <div className="space-y-2.5 text-[13px] leading-relaxed text-white/70 sm:columns-2 sm:gap-8 sm:space-y-0 sm:[&>p]:mb-2.5">
              {BIO.map((para, i) => (
                <p key={i} className="break-inside-avoid">
                  {para}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center border-t border-white/10 px-6 py-3">
          <Link
            href="/orbit"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-white/45 transition-colors hover:text-[#5ee0c8]"
          >
            Enter full orbit
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
