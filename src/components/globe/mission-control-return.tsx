"use client";

import { ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  MODEL_IDLE_URL,
  MODEL_PERSONAL_URL,
} from "@/components/landing/avatar-model";
import type { Project } from "@/lib/store/types";

const ACCENT = "#5ee0c8";

// The avatar shown in the corner for each focused section — mirrors the
// landing avatars. OneSignal (and the all-sections view) uses the default
// avatar; Personal uses the personal avatar.
const AVATAR_BY_CATEGORY: Record<Project["category"], string> = {
  personal: MODEL_PERSONAL_URL,
  onesignal: MODEL_IDLE_URL,
};

const LandingScene = dynamic(
  () => import("@/components/landing/landing-scene"),
  { ssr: false, loading: () => null }
);

// Small framed avatar pinned to the orbit screen's top-left corner. Acts as the
// link back to the landing "mission control" modal.
export function MissionControlReturn({
  onReturn,
  focus = null,
}: {
  onReturn?: () => void;
  // The single section currently in focus, or null when all are shown.
  focus?: Project["category"] | null;
}) {
  const modelUrl = focus ? AVATAR_BY_CATEGORY[focus] : MODEL_IDLE_URL;
  return (
    <Link
      href="/"
      aria-label="Return to mission control"
      onClick={(e) => {
        // Let the scene play the reverse "pan back" transition before routing.
        if (onReturn && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
          e.preventDefault();
          onReturn();
        }
      }}
      className="group absolute left-5 top-[max(1.25rem,env(safe-area-inset-top))] z-[55] flex items-center gap-2.5 sm:gap-3"
    >
      <div
        className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg border border-[#5ee0c8]/25 bg-gradient-to-b from-white/[0.04] to-black/40 transition-all duration-300 group-hover:border-[#5ee0c8]/70 sm:h-20 sm:w-16"
        style={{ boxShadow: "inset 0 0 20px rgba(94,224,200,0.1)" }}
      >
        {/* Canvas is decorative here; let clicks fall through to the link. */}
        <div className="pointer-events-none absolute inset-0">
          <LandingScene modelUrl={modelUrl} interactive={false} />
        </div>
        <span className="pointer-events-none absolute left-1.5 top-1.5 h-3 w-3 rounded-full border border-[#5ee0c8]/40" />
      </div>

      {/* Label collapses on phones so the back tile and the top-right rail
          never collide; the avatar itself stays as the tap target. */}
      <div className="hidden font-mono uppercase leading-tight sm:block">
        <span className="flex items-center gap-1 text-[9px] tracking-[0.25em] text-white/45 transition-colors group-hover:text-[#5ee0c8]">
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
          Return to
        </span>
        <span
          className="mt-0.5 block text-[12px] font-semibold tracking-[0.2em] text-white/85"
          style={{ textShadow: `0 0 12px ${ACCENT}55` }}
        >
          Mission Control
        </span>
      </div>
    </Link>
  );
}
