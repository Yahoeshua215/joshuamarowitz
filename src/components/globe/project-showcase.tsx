"use client";

import { ArrowUpRight, ExternalLink, Play, X } from "lucide-react";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Project } from "@/lib/store/types";
import { categoryLabel, formatDateRange } from "@/lib/utils";
import { StatusBadge } from "../status-badge";
import { categoryColor } from "./orbits";

const linkLabels: Record<string, string> = {
  live: "Live site",
  github: "GitHub",
  video: "Walkthrough",
  figma: "Figma",
};

type PrimaryKind = "live" | "video" | "github" | "figma";

const primaryMeta: Record<
  PrimaryKind,
  { label: string; overlay: string; icon: "open" | "play" }
> = {
  live: { label: "Open live site", overlay: "Open project", icon: "open" },
  video: { label: "Watch walkthrough", overlay: "Watch walkthrough", icon: "play" },
  github: { label: "View source", overlay: "View source", icon: "open" },
  figma: { label: "Open in Figma", overlay: "Open in Figma", icon: "open" },
};

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "");
  }
}

function Corner({
  pos,
  color,
}: {
  pos: "tl" | "tr" | "bl" | "br";
  color: string;
}) {
  const map = {
    tl: "left-3 top-3 border-l border-t",
    tr: "right-3 top-3 border-r border-t",
    bl: "left-3 bottom-3 border-b border-l",
    br: "right-3 bottom-3 border-b border-r",
  } as const;
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute h-4 w-4 ${map[pos]}`}
      style={{ borderColor: `${color}99` }}
    />
  );
}

function Section({
  label,
  color,
  text,
}: {
  label: string;
  color: string;
  text?: string;
}) {
  if (!text || !text.trim()) return null;
  return (
    <div>
      <p
        className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.3em]"
        style={{ color: `${color}99` }}
      >
        {label}
      </p>
      <div className="space-y-2 text-[13px] leading-relaxed text-white/75">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p>{children}</p>,
            strong: ({ children }) => (
              <strong className="font-medium text-white/90">{children}</strong>
            ),
            em: ({ children }) => <em className="italic">{children}</em>,
            ul: ({ children }) => (
              <ul className="ml-4 list-disc space-y-1 marker:text-white/30">
                {children}
              </ul>
            ),
            li: ({ children }) => <li>{children}</li>,
            a: ({ children, href }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-white/25 underline-offset-2 transition-colors hover:decoration-current"
                style={{ color }}
              >
                {children}
              </a>
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    </div>
  );
}

/**
 * "Mission control"-styled project modal used for every project. Instead of an
 * embedded iframe, it shows a screenshot (when we have one) that links out to
 * the live site, a walkthrough recording, or source — plus expanded context
 * (why it exists, what was built, outcome). Adapts to whatever a project has.
 */
export function ProjectShowcase({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const accent = categoryColor(project.category);
  const shot = project.images.find((img) => !img.src.includes("placeholder"));

  const links = project.links ?? {};
  const liveUrl = links.live ?? project.embedUrl;

  // Pick the single most important action this project offers.
  let primaryKind: PrimaryKind | null = null;
  let primaryUrl: string | undefined;
  if (liveUrl) {
    primaryKind = "live";
    primaryUrl = liveUrl;
  } else if (links.video) {
    primaryKind = "video";
    primaryUrl = links.video;
  } else if (links.github) {
    primaryKind = "github";
    primaryUrl = links.github;
  } else if (links.figma) {
    primaryKind = "figma";
    primaryUrl = links.figma;
  }
  const primary = primaryKind ? primaryMeta[primaryKind] : null;

  // Secondary links exclude whatever became the hero CTA above.
  const secondaryLinks = Object.entries(links).filter(
    ([key, url]) => Boolean(url) && key !== primaryKind
  );

  const panelRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rotY = (px - 0.5) * 4;
      const rotX = (0.5 - py) * 3;
      el.style.transform = `perspective(1600px) rotateX(${rotX.toFixed(
        2
      )}deg) rotateY(${rotY.toFixed(2)}deg)`;
      const glow = glowRef.current;
      if (glow) {
        glow.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
        glow.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
        glow.style.opacity = "1";
      }
    });
  }, []);

  const handleLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const el = panelRef.current;
    if (el) el.style.transform = "perspective(1600px) rotateX(0deg) rotateY(0deg)";
    if (glowRef.current) glowRef.current.style.opacity = "0";
  }, []);

  const hasContext = Boolean(
    project.caseStudy || project.tags.length > 0 || secondaryLinks.length > 0
  );

  const hud = (
    <div className="fixed inset-0 z-[100] flex min-h-dvh flex-col items-center overflow-y-auto overscroll-y-contain px-4 pb-8 pt-[max(4rem,env(safe-area-inset-top))] sm:px-8 sm:pb-10">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto flex w-full max-w-[64rem] max-h-[calc(100dvh-6rem)] shrink-0 flex-col">
        <div className="mb-2 flex shrink-0 justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md border border-white/15 bg-[#0a0e16]/95 p-1.5 text-white/70 shadow-lg backdrop-blur-sm transition-colors hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={panelRef}
          onPointerMove={handleMove}
          onPointerLeave={handleLeave}
          role="dialog"
          aria-modal="true"
          aria-label={project.title}
          className="hud-panel relative min-h-0 flex-1 overflow-y-auto rounded-2xl border text-white transition-transform duration-200 ease-out [transform:perspective(1600px)] will-change-transform"
          style={{
            borderColor: `${accent}55`,
            background:
              "linear-gradient(155deg, rgba(255,255,255,0.08), rgba(255,255,255,0.015) 45%), linear-gradient(0deg, rgba(8,11,18,0.92), rgba(8,11,18,0.92))",
            boxShadow: `0 0 60px ${accent}1a, 0 30px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.12)`,
          }}
        >
          {/* Cursor-follow shine */}
          <div
            ref={glowRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20 rounded-2xl opacity-0 transition-opacity duration-500"
            style={{
              background: `radial-gradient(440px circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.1), ${accent}12 34%, transparent 60%)`,
              mixBlendMode: "screen",
            }}
          />
          <Corner pos="tl" color={accent} />
          <Corner pos="tr" color={accent} />
          <Corner pos="bl" color={accent} />
          <Corner pos="br" color={accent} />

          {/* Header */}
          <div className="relative border-b border-white/10 px-6 py-5 sm:px-8">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: accent, boxShadow: `0 0 6px ${accent}` }}
              />
              {categoryLabel(project.category)}
              <span className="text-white/25">·</span>
              {formatDateRange(project.dateStart, project.dateEnd)}
            </div>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {project.title}
              </h2>
              <StatusBadge status={project.status} />
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
              {project.summary}
            </p>
          </div>

          {/* Body — preview left, context right */}
          <div
            className={`grid gap-6 px-6 py-6 sm:px-8 md:gap-8 ${
              hasContext ? "md:grid-cols-[minmax(0,1fr)_300px]" : ""
            }`}
          >
            {/* Preview */}
            <div className="flex flex-col gap-3">
              <p
                className="font-mono text-[10px] uppercase tracking-[0.3em]"
                style={{ color: `${accent}99` }}
              >
                Preview
              </p>

              {(() => {
                const PreviewInner = (
                  <>
                    {shot ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={shot.src}
                        alt={shot.alt}
                        className="aspect-[16/10] w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 text-white/40">
                        {primaryKind === "video" ? (
                          <>
                            <span
                              className="flex h-12 w-12 items-center justify-center rounded-full border"
                              style={{ borderColor: `${accent}66`, color: accent }}
                            >
                              <Play className="h-5 w-5 translate-x-0.5" />
                            </span>
                            <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
                              Walkthrough recording
                            </span>
                          </>
                        ) : (
                          <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
                            Preview coming soon
                          </span>
                        )}
                      </div>
                    )}

                    {/* Browser-chrome top bar */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-1.5 bg-gradient-to-b from-black/55 to-transparent px-3 py-2">
                      <span className="h-2 w-2 rounded-full bg-white/30" />
                      <span className="h-2 w-2 rounded-full bg-white/20" />
                      <span className="h-2 w-2 rounded-full bg-white/15" />
                    </div>

                    {/* Hover overlay CTA (only when there's a screenshot to click through) */}
                    {primary && shot && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/35 group-hover:opacity-100">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] backdrop-blur-sm"
                          style={{
                            borderColor: accent,
                            color: accent,
                            boxShadow: `0 0 18px ${accent}55`,
                          }}
                        >
                          {primary.overlay}
                          {primary.icon === "play" ? (
                            <Play className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          )}
                        </span>
                      </div>
                    )}
                  </>
                );

                const previewClass =
                  "group relative block overflow-hidden rounded-xl border border-white/10 bg-black/40";
                const previewStyle = { boxShadow: `inset 0 0 40px ${accent}10` };

                return primaryUrl ? (
                  <a
                    href={primaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={previewClass}
                    style={previewStyle}
                  >
                    {PreviewInner}
                  </a>
                ) : (
                  <div className={previewClass} style={previewStyle}>
                    {PreviewInner}
                  </div>
                );
              })()}

              {primary && primaryUrl && (
                <a
                  href={primaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
                  style={{ borderColor: `${accent}66`, color: accent }}
                >
                  {primary.icon === "play" ? (
                    <Play className="h-4 w-4" />
                  ) : null}
                  {primary.label}
                  {primary.icon === "open" ? (
                    <ExternalLink className="h-4 w-4" />
                  ) : null}
                  <span className="ml-0.5 truncate font-mono text-[11px] lowercase tracking-normal text-white/40">
                    {hostOf(primaryUrl)}
                  </span>
                </a>
              )}
            </div>

            {/* Context */}
            {hasContext && (
              <div className="flex flex-col gap-5">
                {project.caseStudy && (
                  <>
                    <Section
                      label="Why it exists"
                      color={accent}
                      text={project.caseStudy.problem}
                    />
                    <Section
                      label="What I built"
                      color={accent}
                      text={project.caseStudy.solution}
                    />
                    <Section
                      label="Outcome"
                      color={accent}
                      text={project.caseStudy.outcome}
                    />
                  </>
                )}

                {project.tags.length > 0 && (
                  <div>
                    <p
                      className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em]"
                      style={{ color: `${accent}99` }}
                    >
                      Stack
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-white/65"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {secondaryLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {secondaryLinks.map(([key, url]) => (
                      <a
                        key={key}
                        href={url as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-xs font-medium text-white/90 transition-colors hover:bg-white/10"
                      >
                        {linkLabels[key] ?? key}
                        <ExternalLink className="h-3 w-3 text-white/50" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(hud, document.body);
}
