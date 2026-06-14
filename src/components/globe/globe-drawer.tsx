"use client";

import { ListTree, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { MISSION_CATEGORY_ORDER } from "@/components/landing/landing-data";
import { Project } from "@/lib/store/types";
import { categoryLabel, formatDateRange } from "@/lib/utils";
import { categoryColor } from "./orbits";
import { OrbitHeaderButton } from "./orbit-header-rail";
import { globeStore } from "./use-globe-store";

export function GlobeDrawer({ projects }: { projects: Project[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = projects.filter((p) => {
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });

    return MISSION_CATEGORY_ORDER.map((category) => ({
      category,
      items: matches.filter((p) => p.category === category),
    })).filter((g) => g.items.length > 0);
  }, [projects, query]);

  const total = groups.reduce((sum, g) => sum + g.items.length, 0);

  const handleSelect = (slug: string) => {
    globeStore.select(slug);
    setOpen(false);
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const first = groups[0]?.items[0];
      if (first) handleSelect(first.slug);
    }
  };

  return (
    <>
      <OrbitHeaderButton
        onClick={() => setOpen(true)}
        aria-label="Open project list"
        aria-expanded={open}
      >
        <ListTree className="h-3.5 w-3.5 shrink-0" />
        <span className="orbit-header-btn-label">Projects</span>
        <kbd className="hidden sm:inline">⌘K</kbd>
      </OrbitHeaderButton>

      {mounted
        ? createPortal(
            <>
              <div
                onClick={() => setOpen(false)}
                aria-hidden
                className={`fixed inset-0 z-[56] bg-black/40 backdrop-blur-[1px] transition-opacity duration-300 ${
                  open ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              />

              <aside
                role="dialog"
                aria-modal="true"
                aria-label="Project list"
                className={`fixed inset-y-0 right-0 z-[57] flex w-[88vw] max-w-sm flex-col border-l border-white/10 bg-[#070b12]/95 shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-out ${
                  open ? "translate-x-0" : "pointer-events-none translate-x-full"
                }`}
              >
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div>
                    <h2 className="text-sm font-semibold tracking-tight text-white">
                      Projects
                    </h2>
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
                      {total} in orbit
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    className="rounded-md border border-white/10 bg-white/5 p-1.5 text-white/60 transition-colors hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="border-b border-white/10 px-4 py-3">
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                    <Search className="h-3.5 w-3.5 shrink-0 text-white/40" />
                    <input
                      ref={inputRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={onSearchKeyDown}
                      placeholder="Search projects…"
                      className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 py-3">
                  {groups.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-white/40">
                      No matching projects.
                    </p>
                  ) : (
                    groups.map((group) => (
                      <div key={group.category} className="mb-4 last:mb-0">
                        <p className="px-3 pb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
                          {categoryLabel(group.category)}
                        </p>
                        <ul>
                          {group.items.map((project) => (
                            <li key={project.slug}>
                              <button
                                type="button"
                                onClick={() => handleSelect(project.slug)}
                                className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
                              >
                                <span
                                  className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                                  style={{
                                    backgroundColor: categoryColor(project.category),
                                    boxShadow: `0 0 6px ${categoryColor(project.category)}`,
                                  }}
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-medium text-white/90 group-hover:text-white">
                                    {project.title}
                                  </span>
                                  <span className="block truncate text-[11px] text-white/40">
                                    {formatDateRange(project.dateStart, project.dateEnd)}
                                  </span>
                                </span>
                                <span className="font-mono text-[9px] uppercase tracking-wide text-white/0 transition-colors group-hover:text-white/40">
                                  Focus →
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  )}
                </div>
              </aside>
            </>,
            document.body
          )
        : null}
    </>
  );
}
