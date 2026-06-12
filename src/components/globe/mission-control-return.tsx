"use client";

import { ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { MODEL_IDLE_URL } from "@/components/landing/avatar-model";

const ACCENT = "#5ee0c8";

const LandingScene = dynamic(
  () => import("@/components/landing/landing-scene"),
  { ssr: false, loading: () => null }
);

// Small framed avatar pinned to the orbit screen's top-left corner. Acts as the
// link back to the landing "mission control" modal.
export function MissionControlReturn({
  onReturn,
}: {
  onReturn?: () => void;
}) {
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
      className="group absolute left-5 top-5 z-[55] flex items-center gap-3"
    >
      <div
        className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-[#5ee0c8]/25 bg-gradient-to-b from-white/[0.04] to-black/40 transition-all duration-300 group-hover:border-[#5ee0c8]/70"
        style={{ boxShadow: "inset 0 0 20px rgba(94,224,200,0.1)" }}
      >
        {/* Canvas is decorative here; let clicks fall through to the link. */}
        <div className="pointer-events-none absolute inset-0">
          <LandingScene modelUrl={MODEL_IDLE_URL} interactive={false} />
        </div>
        <span className="pointer-events-none absolute left-1.5 top-1.5 h-3 w-3 rounded-full border border-[#5ee0c8]/40" />
      </div>

      <div className="font-mono uppercase leading-tight">
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
