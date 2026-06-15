"use client";

import { Layers, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

/**
 * Bottom-right "design system" HUD for the orbit page. A self-documenting
 * readout of the actual tokens this site is built from — palette, type ramp,
 * surfaces, lines, and components — styled to read like a product design
 * system spec sheet wired into the mission-control chrome.
 *
 * Everything below is restricted to tokens + components that actually render
 * somewhere on the product surface — not every class that exists in the CSS.
 * Pulled from:
 *   · The .dark theme variables in src/app/globals.css (content pages)
 *   · Mission/section colors in src/components/globe/orbits.ts
 *   · The teal HUD accent shared by the loadout panels + Captain's Log
 */

// HUD accent — shared with the corner return widget + Captain's Log.
const ACCENT = "#5ee0c8";

type Swatch = { name: string; value: string; note?: string };

// Core UI tokens — the .dark theme the product actually renders in. These
// drive the standard content pages (timeline, projects, admin) and the status
// badge shown inside the project modal. The :root light values exist in the
// stylesheet but never surface, so they're intentionally not documented here.
const CORE: Swatch[] = [
  { name: "background", value: "#0f0f0f" },
  { name: "foreground", value: "#ededed" },
  { name: "muted", value: "#8a8a8a" },
  { name: "border", value: "#262626" },
  { name: "surface", value: "#161616" },
  { name: "surface-hover", value: "#1f1f1f" },
  { name: "accent", value: "#b8c96e", note: "olive · shipped badge" },
];

// Mission section colors — kept in sync with the landing HUD card numbers.
const SECTION: Swatch[] = [
  { name: "Releases", value: "#f25f4c", note: "onesignal-work" },
  { name: "OneSignal AI", value: "#f5c542", note: "onesignal" },
  { name: "Personal", value: "#4f9dff", note: "personal" },
  { name: "HUD accent", value: "#5ee0c8", note: "teal · chrome" },
  { name: "Space base", value: "#05070d", note: "night void" },
];

type Section = {
  id: string;
  label: string;
  render: () => React.ReactNode;
};

const SECTIONS: Section[] = [
  { id: "palette", label: "Palette", render: Palette },
  { id: "type", label: "Type", render: TypeRamp },
  { id: "surfaces", label: "Surfaces", render: Surfaces },
  { id: "lines", label: "Lines", render: Lines },
  { id: "components", label: "Components", render: Components },
];

export function DesignSystemHud() {
  const [open, setOpen] = useState(false);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const modal = open ? (
    <div className="fixed inset-0 z-[100] flex min-h-dvh flex-col items-center justify-center px-3 py-[max(2.5rem,env(safe-area-inset-top))] font-mono sm:px-6">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close design system"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Design system reference"
        className="cut-modal relative z-10 my-auto w-full max-w-[90rem] text-white"
        style={{ ["--cut-accent" as string]: ACCENT, ["--cut" as string]: "24px" }}
      >
        <div className="cut-modal-inner flex max-h-[min(92dvh,56rem)] flex-col">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-3.5 sm:px-6">
            <div className="flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: ACCENT, boxShadow: `0 0 7px ${ACCENT}` }}
              />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/85">
                Design System
              </span>
              <span className="text-[9px] uppercase tracking-[0.18em] text-white/30">
                v1.0 · full reference
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded-md border border-white/15 bg-white/5 p-1.5 text-white/60 transition-colors hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body — every section at once across three balanced columns.
              Uniform gap + padding so each module reads with identical spacing;
              the split keeps the tallest column short enough that the whole
              system fits on screen without scrolling on desktop. */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
              {[
                ["components"],
                ["surfaces", "lines"],
                ["type", "palette"],
              ].map((col, i) => (
                <div key={i} className="flex flex-1 flex-col gap-5">
                  {col.map((id) => {
                    const s = SECTIONS.find((x) => x.id === id);
                    if (!s) return null;
                    return (
                      <SectionCard key={s.id} title={s.label}>
                        {s.render()}
                      </SectionCard>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="pointer-events-none absolute bottom-4 right-4 z-10 flex max-w-[calc(100vw-2rem)] flex-col items-end font-mono sm:bottom-5 sm:right-5">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Open design system reference"
        className="orbit-header-btn pointer-events-auto"
      >
        <Layers className="h-3.5 w-3.5 shrink-0" style={{ color: ACCENT }} />
        <span className="orbit-header-btn-label">Design System</span>
      </button>

      {mounted && modal ? createPortal(modal, document.body) : null}
    </div>
  );
}

/* ── Shared bits ─────────────────────────────────────────────────────────── */

// One titled panel in the all-at-once grid. break-inside-avoid keeps each
// section whole as the masonry columns pack them together.
function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
      <h3 className="mb-4 flex items-center gap-2 border-b border-white/10 pb-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/80">
        <span
          className="h-1 w-1 rounded-full"
          style={{ backgroundColor: ACCENT, boxShadow: `0 0 6px ${ACCENT}` }}
        />
        {title}
      </h3>
      {children}
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[9px] uppercase tracking-[0.25em] text-white/35">
      {children}
    </p>
  );
}

function SwatchRow({ s }: { s: Swatch }) {
  return (
    <li className="flex items-center gap-2.5">
      <span
        className="h-6 w-6 shrink-0 rounded-md border border-white/15"
        style={{ backgroundColor: s.value }}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] text-white/85">{s.name}</span>
        {s.note && (
          <span className="block truncate text-[9px] uppercase tracking-[0.12em] text-white/35">
            {s.note}
          </span>
        )}
      </span>
      <span className="text-[10px] uppercase tracking-wide text-white/45">
        {s.value}
      </span>
    </li>
  );
}

/* ── Palette ─────────────────────────────────────────────────────────────── */

function Palette() {
  return (
    <div className="space-y-5">
      <div>
        <Eyebrow>Sections · mission color</Eyebrow>
        <ul className="grid grid-cols-2 gap-x-5 gap-y-2.5">
          {SECTION.map((s) => (
            <SwatchRow key={s.name} s={s} />
          ))}
        </ul>
      </div>
      <div>
        <Eyebrow>Core UI tokens</Eyebrow>
        <ul className="grid grid-cols-2 gap-x-5 gap-y-2.5">
          {CORE.map((s) => (
            <SwatchRow key={s.name} s={s} />
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ── Type ────────────────────────────────────────────────────────────────── */

function TypeRamp() {
  return (
    <div className="space-y-5">
      <div>
        <Eyebrow>Families</Eyebrow>
        <div className="space-y-2.5">
          <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
            <p className="font-sans text-base text-white/90">Inter</p>
            <p className="text-[9px] uppercase tracking-[0.15em] text-white/35">
              --font-inter · sans · UI + prose
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
            <p className="text-base text-white/90">Geist Mono</p>
            <p className="text-[9px] uppercase tracking-[0.15em] text-white/35">
              --font-geist-mono · HUD labels + data
            </p>
          </div>
        </div>
      </div>

      <div>
        <Eyebrow>Ramp</Eyebrow>
        <div className="space-y-2.5">
          <div>
            <p className="font-sans text-xl font-semibold tracking-tight text-white">
              Display · 20px/600
            </p>
            <p className="text-[9px] uppercase tracking-[0.12em] text-white/30">
              text-xl · font-semibold · tracking-tight
            </p>
          </div>
          <div>
            <p className="font-sans text-sm font-medium text-white/90">
              Body · 14px/500
            </p>
            <p className="text-[9px] uppercase tracking-[0.12em] text-white/30">
              text-sm · leading-relaxed
            </p>
          </div>
          <div>
            <p className="text-[11px] text-white/70">Caption · 11px mono</p>
            <p className="text-[9px] uppercase tracking-[0.12em] text-white/30">
              font-mono · text-[11px]
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">
              Eyebrow · 10px · 0.25em
            </p>
            <p className="text-[9px] uppercase tracking-[0.12em] text-white/30">
              mono · uppercase · tracking-wide
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Surfaces ────────────────────────────────────────────────────────────── */

function Surfaces() {
  return (
    <div className="space-y-5">
      <div>
        <Eyebrow>Modal frame · cut-corner</Eyebrow>
        <div
          className="cut-modal"
          style={{ ["--cut-accent" as string]: ACCENT, ["--cut" as string]: "16px" }}
        >
          <div className="cut-modal-inner px-3 py-3">
            <p className="text-[11px] text-white/85">chamfered TL + BR corners</p>
            <p className="text-[9px] uppercase tracking-[0.12em] text-white/35">
              glowing accent border · drop-shadow
            </p>
          </div>
        </div>
        <p className="mt-1.5 text-[9px] uppercase tracking-[0.12em] text-white/30">
          used by every dialog ↑
        </p>
      </div>

      <div>
        <Eyebrow>HUD panel · glass + scanline</Eyebrow>
        <div
          className="rounded-lg border border-white/10 px-3 py-3"
          style={{
            background:
              "linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.012) 45%), rgba(5,9,14,0.9)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <p className="text-[11px] text-white/80">backdrop-blur · black/40–94</p>
          <p className="text-[9px] uppercase tracking-[0.12em] text-white/35">
            border-white/10 · rounded-lg→2xl
          </p>
        </div>
      </div>

      <div>
        <Eyebrow>Mission card · landing</Eyebrow>
        <div className="mission-card rounded-lg px-3 py-3" style={{ ["--c" as string]: ACCENT }}>
          <p className="text-[11px] text-white/85">white/8 → white/1.5 gradient</p>
          <p className="text-[9px] uppercase tracking-[0.12em] text-white/35">
            inset hairline · hover lift
          </p>
        </div>
      </div>

      <div>
        <Eyebrow>Radius · elevation</Eyebrow>
        <div className="flex items-end gap-2">
          {[
            { r: "0.375rem", l: "md" },
            { r: "0.5rem", l: "lg" },
            { r: "0.75rem", l: "xl" },
            { r: "1rem", l: "2xl" },
            { r: "9999px", l: "full" },
          ].map((x) => (
            <div key={x.l} className="flex flex-col items-center gap-1">
              <span
                className="h-9 w-9 border border-white/15 bg-white/[0.05]"
                style={{ borderRadius: x.r }}
              />
              <span className="text-[8px] uppercase tracking-wide text-white/40">
                {x.l}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Lines ───────────────────────────────────────────────────────────────── */

function Lines() {
  return (
    <div className="space-y-5">
      <div>
        <Eyebrow>Dividers · hairlines</Eyebrow>
        <div className="space-y-2.5">
          <div className="h-px bg-white/10" />
          <p className="text-[9px] uppercase tracking-[0.12em] text-white/30">
            border-white/10 · 1px
          </p>
          <div className="h-px bg-white/[0.06]" />
          <p className="text-[9px] uppercase tracking-[0.12em] text-white/30">
            white/6 · subtle
          </p>
        </div>
      </div>

      <div>
        <Eyebrow>Leader line · satellite labels</Eyebrow>
        <div className="flex items-center gap-2">
          <span
            className="block h-px w-16"
            style={{
              background: `linear-gradient(to right, ${ACCENT}, ${ACCENT}40)`,
              boxShadow: `0 0 6px ${ACCENT}b3`,
            }}
          />
          <span className="text-[9px] uppercase tracking-[0.18em] text-white/70">
            Label
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Components ──────────────────────────────────────────────────────────── */

function Components() {
  return (
    <div className="space-y-5">
      <div>
        <Eyebrow>Legend dots</Eyebrow>
        <div className="flex flex-wrap gap-3">
          {SECTION.slice(0, 3).map((s) => (
            <span key={s.name} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: s.value, boxShadow: `0 0 6px ${s.value}` }}
              />
              <span className="text-[10px] text-white/70">{s.name}</span>
            </span>
          ))}
        </div>
      </div>

      <div>
        <Eyebrow>Status badge · project</Eyebrow>
        <div className="flex flex-wrap gap-1.5">
          <span
            className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
            style={{
              borderColor: "#b8c96e4d",
              color: "#b8c96e",
              backgroundColor: "#b8c96e1a",
            }}
          >
            Shipped
          </span>
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/55">
            Prototype
          </span>
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/55">
            Experiment
          </span>
        </div>
      </div>

      <div>
        <Eyebrow>Stack tag · project modal</Eyebrow>
        <div className="flex flex-wrap gap-1.5">
          {["React", "Three.js", "Next.js"].map((t) => (
            <span
              key={t}
              className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-white/65"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div>
        <Eyebrow>HUD button</Eyebrow>
        <div className="flex flex-wrap gap-2">
          <span className="orbit-header-btn !pointer-events-none">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: ACCENT, boxShadow: `0 0 6px ${ACCENT}` }}
            />
            <span className="orbit-header-btn-label">Action</span>
            <kbd>⌘K</kbd>
          </span>
        </div>
      </div>

      <div>
        <Eyebrow>List row</Eyebrow>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-1.5">
          <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: "#4f9dff", boxShadow: "0 0 6px #4f9dff" }}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-medium text-white/90">
                Project title
              </span>
              <span className="block truncate text-[9px] text-white/40">
                Jan 2026 – Now
              </span>
            </span>
            <span className="text-[8px] uppercase tracking-wide text-white/40">
              Focus →
            </span>
          </div>
        </div>
      </div>

      <div>
        <Eyebrow>Reticle · targeting</Eyebrow>
        <div className="flex items-center gap-3">
          <span className="relative grid h-9 w-9 place-items-center">
            <span
              className="scifi-reticle absolute inset-0 rounded-full border"
              style={{ borderColor: `${ACCENT}55` }}
            />
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: ACCENT, boxShadow: `0 0 8px ${ACCENT}` }}
            />
          </span>
          <span className="text-[9px] uppercase tracking-[0.12em] text-white/35">
            spin · 14s linear
          </span>
        </div>
      </div>
    </div>
  );
}
