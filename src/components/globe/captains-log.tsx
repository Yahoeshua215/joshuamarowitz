"use client";

import { Radio, ScrollText, Search, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LogWeek } from "@/lib/log/types";
import { OrbitHeaderButton } from "./orbit-header-rail";

// The log ties into the "mission control" chrome, so it shares the teal accent
// used by the corner return widget and the loadout panels.
const ACCENT = "#5ee0c8";

function matchesQuery(week: LogWeek, q: string): boolean {
  if (!q) return true;
  if (week.label.toLowerCase().includes(q)) return true;
  if (week.theme?.toLowerCase().includes(q)) return true;
  return week.lines.some(
    (l) =>
      l.topic.toLowerCase().includes(q) || l.body.toLowerCase().includes(q)
  );
}

/** Markdown body of a single logged line — accent links, tight typography. */
function LogBody({ children }: { children: string }) {
  return (
    <div className="space-y-1.5 text-[13px] leading-relaxed text-white/70">
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
          a: ({ children, href }) => {
            // Never surface links to Figma files — render the label as plain
            // text so the entry still reads cleanly, just without the link.
            if (href && /figma\.com/i.test(href)) {
              return <span>{children}</span>;
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-white/25 underline-offset-2 transition-colors hover:decoration-current"
                style={{ color: ACCENT }}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export function CaptainsLog({ weeks }: { weeks: LogWeek[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(
    weeks[0]?.id ?? null
  );

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Pointer-driven tilt + cursor-follow shine, matching the project modal.
  const panelRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

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
    if (el)
      el.style.transform = "perspective(1600px) rotateX(0deg) rotateY(0deg)";
    if (glowRef.current) glowRef.current.style.opacity = "0";
  }, []);

  // Distinct reporting periods (quarters), newest first, for the range filter.
  const periods = useMemo(() => {
    const seen: string[] = [];
    for (const w of weeks) if (!seen.includes(w.period)) seen.push(w.period);
    return seen;
  }, [weeks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return weeks.filter(
      (w) =>
        (period === "all" || w.period === period) && matchesQuery(w, q)
    );
  }, [weeks, period, query]);

  // Selected week: honor the click, but fall back to the first visible week
  // whenever the current selection drops out of the filtered set.
  const selected = useMemo(
    () =>
      filtered.find((w) => w.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId]
  );

  const totalEntries = useMemo(
    () => weeks.reduce((n, w) => n + w.lines.length, 0),
    [weeks]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleOpen = useCallback(() => {
    setQuery("");
    setPeriod("all");
    setOpen(true);
  }, []);

  if (weeks.length === 0) return null;

  const modal = open ? (
    <div className="fixed inset-0 z-[100] flex min-h-dvh flex-col items-center overflow-y-auto px-3 pb-6 pt-[max(3.5rem,env(safe-area-inset-top))] sm:px-6 sm:pb-8">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close log"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        role="dialog"
        aria-modal="true"
        aria-label="Product Designer log"
        className="hud-panel relative z-10 my-auto flex w-full max-w-[68rem] flex-col overflow-hidden rounded-2xl border text-white transition-transform duration-200 ease-out [transform:perspective(1600px)] will-change-transform sm:h-[min(82dvh,46rem)]"
        style={{
          borderColor: `${ACCENT}55`,
          background:
            "linear-gradient(155deg, rgba(255,255,255,0.06), rgba(255,255,255,0.012) 45%), linear-gradient(0deg, rgba(6,11,18,0.96), rgba(6,11,18,0.96))",
          boxShadow: `0 0 60px ${ACCENT}1a, 0 30px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.1)`,
        }}
      >
        {/* Cursor-follow shine */}
        <div
          ref={glowRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 rounded-2xl opacity-0 transition-opacity duration-500"
          style={{
            background: `radial-gradient(440px circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.1), ${ACCENT}12 34%, transparent 60%)`,
            mixBlendMode: "screen",
          }}
        />

        {/* Header */}
        <div className="relative shrink-0 border-b border-white/10 px-5 py-4 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-white/75">
                <Radio
                  className="h-3 w-3"
                  style={{ color: ACCENT }}
                  aria-hidden
                />
                Operator Joshua Marowitz
              </div>
              <h2
                className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl"
                style={{ textShadow: `0 0 18px ${ACCENT}40` }}
              >
                Product Designer Log
              </h2>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                #design updates · OneSignal · {weeks.length} entries ·{" "}
                {totalEntries} records
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="shrink-0 rounded-md border border-white/15 bg-white/5 p-1.5 text-white/60 transition-colors hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search + period (date-range) filter */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 sm:w-64">
              <Search className="h-3.5 w-3.5 shrink-0 text-white/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the log…"
                className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <PeriodChip
                label="All"
                active={period === "all"}
                onClick={() => setPeriod("all")}
              />
              {periods.map((p) => (
                <PeriodChip
                  key={p}
                  label={p}
                  active={period === p}
                  onClick={() => setPeriod(p)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Body — index rail + detail feed */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Index rail */}
          <nav
            aria-label="Log index"
            className="max-h-44 shrink-0 overflow-y-auto border-b border-white/10 px-2 py-2 md:max-h-none md:w-64 md:border-b-0 md:border-r"
          >
            <p className="px-2 pb-1.5 pt-1 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
              {filtered.length} {filtered.length === 1 ? "log" : "logs"}
            </p>
            {filtered.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-white/40">
                No logs in range.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {filtered.map((w, i) => {
                  const isSel = selected?.id === w.id;
                  const showYear = i === 0 || filtered[i - 1].year !== w.year;
                  return (
                    <li key={w.id}>
                      {showYear && (
                        <p className="px-2 pb-1 pt-2 font-mono text-[9px] uppercase tracking-[0.3em] text-white/25">
                          {w.year}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedId(w.id)}
                        className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors ${
                          isSel ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"
                        }`}
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={
                            isSel
                              ? {
                                  backgroundColor: ACCENT,
                                  boxShadow: `0 0 7px ${ACCENT}`,
                                }
                              : { backgroundColor: "rgba(255,255,255,0.18)" }
                          }
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-[12px] ${
                              isSel
                                ? "font-medium text-white"
                                : "text-white/70"
                            }`}
                          >
                            {w.label.replace(/,\s*\d{4}$/, "")}
                          </span>
                        </span>
                        <span className="font-mono text-[9px] text-white/30">
                          {w.lines.length}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </nav>

          {/* Detail feed */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
            {selected ? (
              <article>
                <div className="mb-5 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-white/45">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor: ACCENT,
                        boxShadow: `0 0 6px ${ACCENT}`,
                      }}
                    />
                    {selected.lines.length} records
                  </div>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight sm:text-xl">
                    {selected.label}
                  </h3>
                  {selected.aside && (
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
                      {selected.aside}
                    </p>
                  )}
                  {selected.theme && (
                    <p
                      className="mt-2 text-[13px] italic leading-relaxed text-white/65"
                      style={{ color: `${ACCENT}cc` }}
                    >
                      {selected.theme}
                    </p>
                  )}
                </div>

                <ul className="space-y-4">
                  {selected.lines.map((line, i) => (
                    <li
                      key={i}
                      className="relative pl-4"
                      style={{
                        borderLeft: `1px solid ${
                          line.note ? "rgba(255,255,255,0.1)" : `${ACCENT}40`
                        }`,
                      }}
                    >
                      {line.topic && (
                        <p
                          className="mb-1 font-mono text-[10px] font-medium uppercase tracking-[0.18em]"
                          style={{ color: `${ACCENT}dd` }}
                        >
                          {line.topic}
                        </p>
                      )}
                      {line.note ? (
                        <p className="text-[12px] italic leading-relaxed text-white/45">
                          {line.body}
                        </p>
                      ) : (
                        <LogBody>{line.body}</LogBody>
                      )}
                    </li>
                  ))}
                </ul>
              </article>
            ) : (
              <p className="py-10 text-center text-sm text-white/40">
                Select a log entry.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <OrbitHeaderButton onClick={handleOpen} aria-label="Open product designer log">
        <ScrollText className="h-3.5 w-3.5 shrink-0" style={{ color: ACCENT }} />
        <span className="orbit-header-btn-label">Product Designer Log</span>
      </OrbitHeaderButton>

      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}

function PeriodChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors"
      style={
        active
          ? {
              borderColor: `${ACCENT}80`,
              color: ACCENT,
              backgroundColor: `${ACCENT}14`,
            }
          : {
              borderColor: "rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.55)",
            }
      }
    >
      {label}
    </button>
  );
}
