"use client";

import type { ReactNode } from "react";

/** Shared top-right HUD strip for orbit page actions (Projects, Operator's Log). */
export function OrbitHeaderRail({ children }: { children: ReactNode }) {
  return (
    <aside
      aria-label="Orbit controls"
      className="orbit-header-rail absolute right-5 top-[max(1.25rem,env(safe-area-inset-top))] z-[55]"
    >
      {children}
    </aside>
  );
}

export function OrbitHeaderButton({
  children,
  className = "",
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button type="button" className={`orbit-header-btn ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
