"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

// On the landing and orbit screens, navigation happens through the in-scene
// controls (mission cards forward, the avatar widget back to mission control),
// so the global nav bar is hidden there to keep those views immersive.
const HIDE_ON = new Set(["/", "/orbit"]);

export function Header() {
  const pathname = usePathname();
  if (HIDE_ON.has(pathname)) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div>
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Josh Log
          </Link>
          <p className="text-xs text-muted">Product design work log</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/orbit"
            className="text-xs text-muted transition-colors hover:text-foreground"
          >
            Orbit
          </Link>
          <Link
            href="/timeline"
            className="text-xs text-muted transition-colors hover:text-foreground"
          >
            Timeline
          </Link>
          <Link
            href="/admin"
            className="text-xs text-muted transition-colors hover:text-foreground"
          >
            Admin
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
