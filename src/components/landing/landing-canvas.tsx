"use client";

import { ArrowRight, Linkedin } from "lucide-react";
import dynamic from "next/dynamic";
import NextImage from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  MODEL_DANCE_URL,
  MODEL_IDLE_URL,
  MODEL_PERSONAL_DANCE_URL,
  MODEL_PERSONAL_RUN_URL,
  MODEL_PERSONAL_URL,
  MODEL_RUN_URL,
} from "./avatar-model";
import { BIO, LINKEDIN_URL, NAME, ROLE } from "./landing-data";
import { MissionSwitch, type MissionLaunch } from "./mission-select";
import type { Project } from "@/lib/store/types";

// Total time the panel pan plays before we route to /orbit.
const LAUNCH_MS = 1200;

// How long the modal "pan in" plays when returning from the orbit view.
const RETURN_IN_MS = 1000;

// Set before paint (avoids a flash of the panel at rest) when available.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Warmed during the transition so the orbit globe paints instantly on arrival.
const EARTH_TEXTURES = [
  "/textures/earth_day.jpg",
  "/textures/earth_normal.jpg",
  "/textures/earth_specular.jpg",
  "/textures/earth_clouds.png",
  "/textures/earth_night.jpg",
];
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

// Instrumentation rail flanking the panel — sits just outside the left/right
// edge but ties into the panel center, so it reads as part of the unit. Hidden
// on narrow screens where the panel goes edge-to-edge.
function SideRail({ side }: { side: "left" | "right" }) {
  const isLeft = side === "left";
  const edge = isLeft ? "left-0" : "right-0";
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-y-10 hidden w-9 xl:block ${
        isLeft ? "-left-12" : "-right-12"
      }`}
    >
      {/* Vertical spine on the outer edge, fading at both ends */}
      <span
        className={`absolute inset-y-0 w-px ${edge}`}
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(94,224,200,0.5) 16%, rgba(94,224,200,0.5) 84%, transparent)",
        }}
      />

      {/* Bracket end-caps top and bottom */}
      <span
        className={`absolute top-0 h-3 w-2.5 border-t border-[#5ee0c8]/55 ${edge} ${
          isLeft ? "border-l" : "border-r"
        }`}
      />
      <span
        className={`absolute bottom-0 h-3 w-2.5 border-b border-[#5ee0c8]/55 ${edge} ${
          isLeft ? "border-l" : "border-r"
        }`}
      />

      {/* Graduated ticks reaching inward from the spine, like a gauge scale */}
      {[14, 26, 74, 86].map((t) => (
        <span
          key={t}
          className={`absolute h-px w-2 bg-[#5ee0c8]/35 ${edge}`}
          style={{ top: `${t}%` }}
        />
      ))}

      {/* A lone tracer that scans slowly down the spine */}
      <span
        className={`side-rail-scan absolute h-6 w-px ${edge}`}
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(94,224,200,0.9), transparent)",
        }}
      />

      {/* Center connector + diamond node — the visual "attachment" to the panel */}
      <span
        className={`absolute top-1/2 h-px -translate-y-1/2 bg-[#5ee0c8]/45 ${
          isLeft ? "left-1.5 right-0" : "right-1.5 left-0"
        }`}
      />
      <span
        className={`side-rail-node absolute top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border border-[#5ee0c8] ${
          isLeft ? "left-0.5" : "right-0.5"
        }`}
      />

      {/* Vertical readout — spacecraft port / starboard */}
      <span
        className="absolute left-1/2 top-1/2 whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.45em] text-[#5ee0c8]/35"
        style={{
          transform: `translate(-50%, -50%) rotate(${isLeft ? -90 : 90}deg)`,
        }}
      >
        {isLeft ? "Port" : "Stbd"}
      </span>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-[#5ee0c8]/60">
      {children}
    </p>
  );
}

export function LandingCanvas() {
  const router = useRouter();
  // Which avatar pose is showing. Each reticle toggles its own pose on/off.
  const [pose, setPose] = useState<"idle" | "run" | "dance">("idle");
  const togglePose = useCallback(
    (next: "run" | "dance") => setPose((p) => (p === next ? "idle" : next)),
    []
  );
  // Which mission segment is selected. Drives the launch target, the card flip,
  // and (after a brief beat) which avatar is shown. Defaults to OneSignal.
  const [selectedMission, setSelectedMission] =
    useState<Project["category"]>("onesignal");
  // The avatar model lags the selection slightly: on a switch the model spins
  // up fast (via spinToken) and only swaps mid-spin, so it reads as "spin, then
  // change" rather than an instant pop.
  const [avatarMission, setAvatarMission] =
    useState<Project["category"]>("onesignal");
  const [spinToken, setSpinToken] = useState(0);
  const firstMissionRef = useRef(true);
  const isPersonal = avatarMission === "personal";

  useEffect(() => {
    if (firstMissionRef.current) {
      firstMissionRef.current = false;
      return;
    }
    // Kick the avatar into a fast spin, then swap the model mid-spin.
    setSpinToken((t) => t + 1);
    const id = setTimeout(() => setAvatarMission(selectedMission), 280);
    return () => clearTimeout(id);
  }, [selectedMission]);
  // Non-null while the pivot-to-orbit transition is playing.
  const [launch, setLaunch] = useState<MissionLaunch | null>(null);
  // True while the modal "pans back in" after returning from the orbit view.
  const [entering, setEntering] = useState(false);
  // Bumped to remount the avatar canvas once the pan-in settles, so it
  // remeasures at its true size (it was sized while the panel was transformed).
  const [avatarNonce, setAvatarNonce] = useState(0);
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

  const handleLaunch = useCallback(
    (mission: MissionLaunch) => {
      // Honor reduced-motion: skip the cinematic and just navigate.
      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        router.push(mission.href);
        return;
      }
      router.prefetch(mission.href);
      // Warm the globe chunk + Earth textures while the pan plays, so the
      // orbit scene can paint immediately and the curtain lifts cleanly.
      import("@/components/globe/globe-scene").catch(() => {});
      for (const src of EARTH_TEXTURES) {
        const img = new Image();
        img.src = src;
      }
      setLaunch(mission);
    },
    [router]
  );

  // Once the pivot animation has played, complete the route to the orbit view.
  useEffect(() => {
    if (!launch) return;
    const t = setTimeout(() => router.push(launch.href), LAUNCH_MS);
    return () => clearTimeout(t);
  }, [launch, router]);

  // Arriving back from the orbit view? Play the modal "pan in" (reverse of the
  // launch pan). Read the flag before paint so the panel never flashes at rest.
  useIsoLayoutEffect(() => {
    let returning = false;
    try {
      returning = sessionStorage.getItem("mc-return") === "1";
      if (returning) sessionStorage.removeItem("mc-return");
    } catch {}
    if (returning) setEntering(true);
  }, []);

  useEffect(() => {
    if (!entering) return;
    // When the pan-in settles, clear the transform AND remount the avatar so
    // its WebGL canvas remeasures at the true (untransformed) size — otherwise
    // it stays stuck at the size it measured mid-animation (zoomed-out).
    const done = setTimeout(() => {
      setEntering(false);
      setAvatarNonce((n) => n + 1);
    }, RETURN_IN_MS);
    return () => clearTimeout(done);
  }, [entering]);

  return (
    <div
      className={`scifi-bg fixed inset-0 z-0 min-h-dvh overflow-hidden text-white ${
        launch ? "is-launching" : ""
      } ${entering ? "is-returning" : ""}`}
    >
      {/* The whole launch diorama lives in one 3D space; the world yaws on
          mission select so the Earth swings in as the panel turns away. */}
      <div className="pivot-stage">
      <div className="pivot-world">
      {/* Drifting space backdrop — sits OUTSIDE the panel so it stays put
          while the modal pans off into it (parallax sells the depth). */}
      <div className="pivot-backdrop pointer-events-none absolute overflow-hidden" aria-hidden>
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

      {/* Mission-control panel — pans off to the side on launch. */}
      <div className="pivot-front relative flex h-full min-h-0 w-full flex-col items-center overflow-y-auto overscroll-y-contain px-4 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))] sm:py-8">
      <div
        ref={panelRef}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        className="relative z-10 my-auto w-full max-w-[72rem] shrink-0 transition-transform duration-200 ease-out [transform:perspective(1500px)] will-change-transform"
      >
      {/* Chamfered accent frame — the same cut-corner treatment as the project
          showcase + design-system modals: the outer paints the glowing accent
          border, the inner holds the clipped glass fill. */}
      <div
        className="cut-modal"
        style={{ ["--cut-accent" as string]: ACCENT, ["--cut" as string]: "26px" }}
      >
      <div
        className="hud-panel cut-modal-inner backdrop-blur-md"
        style={{
          // Near-opaque dark fill so the accent frame only reads as a thin
          // border — a translucent fill would let the teal bleed across the
          // whole panel.
          background:
            "linear-gradient(155deg, rgba(255,255,255,0.07), rgba(255,255,255,0.012) 45%, rgba(94,224,200,0.035)), linear-gradient(0deg, rgba(9,13,21,0.96), rgba(9,13,21,0.96))",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
        }}
      >
        {/* Cursor-follow shine */}
        <div
          ref={glowRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(480px circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.14), rgba(94,224,200,0.07) 32%, transparent 60%)",
            mixBlendMode: "screen",
          }}
        />
        {/* Brackets flank the two sharp corners; the chamfer dresses the other two. */}
        <Corner pos="tr" />
        <Corner pos="bl" />

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
            <p className="mt-1 flex items-center justify-center gap-1.5 text-xs lowercase tracking-wide text-white/50">
              base of operations ·
              <a
                href="https://onesignal.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="OneSignal"
                title="OneSignal"
                onPointerDown={(e) => e.stopPropagation()}
                className="inline-flex items-center opacity-90 transition-opacity hover:opacity-100"
              >
                {/* Tiny inline wordmark sized to the surrounding font height. */}
                <NextImage
                  src="/onesignal-logo-white.png"
                  alt="OneSignal"
                  width={916}
                  height={203}
                  className="h-[20px] w-auto"
                  priority
                />
              </a>
            </p>
          </div>
          {/* LinkedIn — docked top-left, mirrors the Sys · Online badge */}
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            title="LinkedIn"
            onPointerDown={(e) => e.stopPropagation()}
            className="group absolute left-10 top-4 flex h-7 w-7 items-center justify-center rounded-md border border-white/15 bg-white/[0.04] text-white/55 transition-all hover:-translate-y-0.5 hover:border-[#5ee0c8]/60 hover:text-[#5ee0c8] hover:shadow-[0_0_12px_rgba(94,224,200,0.35)]"
          >
            <Linkedin className="h-3.5 w-3.5" />
          </a>
          <div className="absolute right-6 top-4 hidden items-center gap-2 font-mono text-[9px] uppercase tracking-[0.25em] text-[#5ee0c8]/60 sm:flex">
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#5ee0c8]"
              style={{ boxShadow: `0 0 8px ${ACCENT}` }}
            />
            Sys · Online
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8">
          {/* Top row: avatar · missions/toolkit · skills. The center track is
              kept wide enough that the segmented-control labels never wrap; the
              avatar is pushed left and skills right to give it breathing room. */}
          {/* Symmetric flanks (avatar | mission | profile) keep the mission
              card dead-center in the modal; the avatar frame stays capped and
              centered within its track. */}
          <div className="grid justify-center gap-5 md:grid-cols-[minmax(260px,320px)_minmax(390px,430px)_minmax(260px,320px)] md:items-stretch md:gap-8">
          {/* Center: mission panel, then the two animated tickers (toolkit +
              skills) side by side below it. */}
          <div className="order-2 flex flex-col gap-5 md:order-2 md:gap-8">
            <div>
              <Label>Select a mission</Label>
              <MissionSwitch
                value={selectedMission}
                onChange={setSelectedMission}
                onLaunch={handleLaunch}
              />
            </div>
            {/* Toolkit + skills: one labeled panel (label above the card, like
                the other sections), split by a vertical divider. Never flips —
                only the mission card does. */}
            <div className="flex min-h-0 flex-1 flex-col">
              <Label>Toolkit and Skills</Label>
              <div className="grid min-h-0 flex-1 grid-cols-[0.9fr_1.1fr] gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-3">
                <div className="flex items-center justify-center text-center">
                  <SkillScramble />
                </div>
                <div className="border-l border-white/[0.08] pl-3">
                  <SkillsCredits />
                </div>
              </div>
            </div>
          </div>

          {/* Left: avatar hologram */}
          <div className="order-1 flex flex-col md:order-1">
            <Label>Avatar</Label>
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onPointerMove={(e) => e.stopPropagation()}
              className="relative w-full flex-1 min-h-[260px] cursor-grab overflow-hidden rounded-2xl border border-[#5ee0c8]/20 bg-gradient-to-b from-white/[0.04] to-black/30 active:cursor-grabbing"
              style={{ boxShadow: "inset 0 0 30px rgba(94,224,200,0.08)" }}
            >
              <LandingScene
                key={avatarNonce}
                spinToken={spinToken}
                modelUrl={
                  isPersonal
                    ? pose === "run"
                      ? MODEL_PERSONAL_RUN_URL
                      : pose === "dance"
                        ? MODEL_PERSONAL_DANCE_URL
                        : MODEL_PERSONAL_URL
                    : pose === "run"
                      ? MODEL_RUN_URL
                      : pose === "dance"
                        ? MODEL_DANCE_URL
                        : MODEL_IDLE_URL
                }
              />

              {/* Stand toggle — the default pose */}
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setPose("idle")}
                aria-pressed={pose === "idle"}
                aria-label="Stand"
                title="Stand"
                className="group absolute right-3 top-3 h-8 w-8 cursor-pointer rounded-full transition-transform hover:scale-110"
              >
                <span
                  className={`scifi-reticle absolute inset-0 rounded-full border ${
                    pose === "idle"
                      ? "border-[#5ee0c8]"
                      : "border-[#5ee0c8]/40 group-hover:border-[#5ee0c8]/80"
                  }`}
                  style={pose === "idle" ? { boxShadow: `0 0 10px ${ACCENT}` } : undefined}
                />
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                  className={`absolute left-1/2 top-1/2 h-[15px] w-[15px] -translate-x-1/2 -translate-y-1/2 transition-colors ${
                    pose === "idle"
                      ? "text-[#5ee0c8]"
                      : "text-[#5ee0c8]/45 group-hover:text-[#5ee0c8]/85"
                  }`}
                  style={pose === "idle" ? { filter: `drop-shadow(0 0 5px ${ACCENT})` } : undefined}
                >
                  <path d="M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM14 7h-4a2 2 0 0 0-2 2v6h2v7h4v-7h2V9a2 2 0 0 0-2-2z" />
                </svg>
              </button>

              {/* Runner toggle — click to switch to the running avatar */}
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => togglePose("run")}
                aria-pressed={pose === "run"}
                aria-label={pose === "run" ? "Stop running" : "Run"}
                title={pose === "run" ? "Stop" : "Run"}
                className="group absolute right-3 top-14 h-8 w-8 cursor-pointer rounded-full transition-transform hover:scale-110"
              >
                <span
                  className={`scifi-reticle absolute inset-0 rounded-full border ${
                    pose === "run"
                      ? "border-[#5ee0c8]"
                      : "border-[#5ee0c8]/40 group-hover:border-[#5ee0c8]/80"
                  }`}
                  style={pose === "run" ? { boxShadow: `0 0 10px ${ACCENT}` } : undefined}
                />
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                  className={`absolute left-1/2 top-1/2 h-[15px] w-[15px] -translate-x-1/2 -translate-y-1/2 transition-colors ${
                    pose === "run"
                      ? "text-[#5ee0c8]"
                      : "text-[#5ee0c8]/45 group-hover:text-[#5ee0c8]/85"
                  }`}
                  style={pose === "run" ? { filter: `drop-shadow(0 0 5px ${ACCENT})` } : undefined}
                >
                  <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z" />
                </svg>
              </button>

              {/* Dance toggle — click to switch to the dancing avatar */}
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => togglePose("dance")}
                aria-pressed={pose === "dance"}
                aria-label={pose === "dance" ? "Stop dancing" : "Dance"}
                title={pose === "dance" ? "Stop" : "Dance"}
                className="group absolute right-3 top-[6.25rem] h-8 w-8 cursor-pointer rounded-full transition-transform hover:scale-110"
              >
                <span
                  className={`scifi-reticle absolute inset-0 rounded-full border ${
                    pose === "dance"
                      ? "border-[#5ee0c8]"
                      : "border-[#5ee0c8]/40 group-hover:border-[#5ee0c8]/80"
                  }`}
                  style={pose === "dance" ? { boxShadow: `0 0 10px ${ACCENT}` } : undefined}
                />
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                  className={`absolute left-1/2 top-1/2 h-[15px] w-[15px] -translate-x-1/2 -translate-y-1/2 transition-colors ${
                    pose === "dance"
                      ? "text-[#5ee0c8]"
                      : "text-[#5ee0c8]/45 group-hover:text-[#5ee0c8]/85"
                  }`}
                  style={pose === "dance" ? { filter: `drop-shadow(0 0 5px ${ACCENT})` } : undefined}
                >
                  <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6.31.43l-3.66-.97-2.01 3.36-3.79-1.81 1.01-2.1-1.81-.86-1.71 3.55 5.31 2.54-2.42 7.83-2.11-.66L7.42 13l-2.85 7.61 1.88.7 2.39-6.39 4.6 1.43L10.81 23h2.11l2.31-7.09-3.93-1.22.78-2.55c1.57 1.25 3.37 2.17 5.46 2.39l1.66-7.21z" />
                </svg>
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

          {/* Right: profile copy, carded to balance the avatar card opposite. */}
          <div className="order-3 flex flex-col md:order-3">
            <Label>Profile</Label>
            <div className="flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-3">
              <div className="space-y-3 text-[12.5px] leading-7 text-white/70">
                {BIO.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
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

      {/* Side rails live outside the clip so they can reach past the panel edges. */}
      <SideRail side="left" />
      <SideRail side="right" />
      </div>
      </div>
      {/* End mission-control panel. */}
      </div>
      </div>

      {/* Flat overlay above the panel: settle-to-orbit fade + status. */}
      {launch && (
        <div className="pivot-overlay" aria-hidden>
          <div className="pivot-hud">
            <span
              className="pivot-hud-dot"
              style={{ background: launch.color, boxShadow: `0 0 10px ${launch.color}` }}
            />
            <span>Re-orienting · entering orbit</span>
            <strong style={{ color: launch.color }}>{launch.label}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
