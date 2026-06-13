"use client";

import { OrbitControls, Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Dribbble } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { DRIBBBLE_URL } from "@/components/landing/landing-data";
import { Project } from "@/lib/store/types";

// Time the reverse "pan back to mission control" plays before routing home.
const RETURN_MS = 900;

// Rendered inside the scene's <Suspense> boundary, so its effect only runs
// once the Earth textures have resolved — our signal to lift the curtain.
function SceneReady({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    const id = requestAnimationFrame(onReady);
    return () => cancelAnimationFrame(id);
  }, [onReady]);
  return null;
}
import { CameraRig } from "./camera-rig";
import { Earth } from "./earth";
import { GlobeDrawer } from "./globe-drawer";
import { GlobeLegend } from "./globe-legend";
import { MissionControlReturn } from "./mission-control-return";
import { ProjectShowcase } from "./project-showcase";
import { SatelliteField } from "./satellite-field";
import { Satellites } from "./satellites";
import { globeStore, useGlobeStore } from "./use-globe-store";

const ALL_CATEGORIES: Project["category"][] = [
  "personal",
  "onesignal",
  "onesignal-work",
];

// Orbit visualization style. "dots" is the new glowing-dot + leader-line field;
// "models" is the original modeled satellites, kept around (tucked away) so we
// can switch back at any time.
const ORBIT_STYLE: "dots" | "models" = "dots";

export default function GlobeScene({
  projects,
  initialFocus = null,
}: {
  projects: Project[];
  initialFocus?: Project["category"] | null;
}) {
  const router = useRouter();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const timeRef = useRef(0);
  const { modalSlug, paused } = useGlobeStore();
  const { resolvedTheme } = useTheme();

  // Dark curtain stays up until the globe is painted, then lifts.
  const [ready, setReady] = useState(false);

  // Non-null while the reverse "pan back to mission control" plays.
  const [returning, setReturning] = useState(false);

  // Safety net: never let the curtain stick if the ready signal misfires.
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const handleReturn = useCallback(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      router.push("/");
      return;
    }
    // Flag the landing page to play the matching modal "pan in" on arrival.
    try {
      sessionStorage.setItem("mc-return", "1");
    } catch {}
    router.prefetch("/");
    setReturning(true);
  }, [router]);

  useEffect(() => {
    if (!returning) return;
    const t = setTimeout(() => router.push("/"), RETURN_MS);
    return () => clearTimeout(t);
  }, [returning, router]);

  const [active, setActive] = useState<Set<Project["category"]>>(
    () => new Set(initialFocus ? [initialFocus] : ALL_CATEGORIES)
  );

  const toggleCategory = (category: Project["category"]) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        // Never let the user hide everything.
        if (next.size > 1) next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const visibleProjects = useMemo(
    () => projects.filter((p) => active.has(p.category)),
    [projects, active]
  );

  // Surface the Dribbble link only while focused on the OneSignal product
  // releases (the shipped design work it pairs with).
  const releasesFocused = active.size === 1 && active.has("onesignal-work");

  // When a single section is in focus, the corner return-widget shows that
  // section's avatar; otherwise it falls back to the default idle avatar.
  const soloCategory: Project["category"] | null =
    active.size === 1 ? [...active][0] : null;

  // Default to the dark (night) side until the theme resolves on the client.
  const night = resolvedTheme !== "light";
  const background = night ? "#05070d" : "#0a1326";

  const modalProject =
    projects.find((p) => p.slug === modalSlug) ?? null;

  return (
    <div className="fixed inset-0 z-0" style={{ backgroundColor: background }}>
      {/* Persistent stars — sit behind the scene and are revealed when it
          pans away on return, so the field never blanks. */}
      <div
        className={`orbit-stars ${returning ? "is-returning-out" : ""}`}
        aria-hidden
      >
        <div className="space-layer space-stars space-stars-1" />
        <div className="space-layer space-stars space-stars-2" />
        <div className="space-layer space-stars space-stars-3" />
      </div>

      {/* Globe + HUD — pans off to the right on return to mission control. */}
      <div className={`orbit-scene ${returning ? "is-returning-out" : ""}`}>
      <div className={`orbit-rise ${ready ? "is-rising" : ""}`}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 1.1, 8], fov: 45 }}
        gl={{ antialias: true }}
        onPointerMissed={
          ORBIT_STYLE === "models" ? () => globeStore.clear() : undefined
        }
      >
        <color attach="background" args={[background]} />
        <ambientLight intensity={night ? 0.12 : 0.55} />
        <directionalLight
          position={night ? [-5, 2, -4.5] : [5, 2, 4.5]}
          intensity={night ? 2.2 : 2.6}
          color="#fff6e8"
        />
        <Suspense fallback={null}>
          <Earth night={night} />
          <SceneReady onReady={() => setReady(true)} />
          {ORBIT_STYLE === "dots" ? (
            <SatelliteField projects={visibleProjects} timeRef={timeRef} />
          ) : (
            <Satellites projects={visibleProjects} timeRef={timeRef} />
          )}
        </Suspense>
        <Stars
          radius={80}
          depth={40}
          count={4000}
          factor={4}
          saturation={0}
          fade
          speed={0.5}
        />
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={2.2}
          maxDistance={14}
          autoRotate={!paused}
          autoRotateSpeed={0.35}
        />
        <CameraRig controlsRef={controlsRef} timeRef={timeRef} />
      </Canvas>
      </div>

      <MissionControlReturn onReturn={handleReturn} focus={soloCategory} />

      <GlobeLegend
        count={visibleProjects.length}
        active={active}
        onToggle={toggleCategory}
      />
      <GlobeDrawer projects={visibleProjects} />

      {releasesFocused && (
        <a
          href={DRIBBBLE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group absolute bottom-5 right-5 z-10 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.15em] text-white/70 backdrop-blur-sm transition-colors hover:border-[#ea4c89]/60 hover:text-[#ea4c89]"
        >
          <Dribbble className="h-3.5 w-3.5" />
          Design shots
        </a>
      )}
      </div>

      {modalProject && (
        <ProjectShowcase project={modalProject} onClose={() => globeStore.clear()} />
      )}

      {/* Starfield curtain — holds the same stars over the loading globe so
          the field never blanks between the launch pan and the orbit reveal. */}
      <div className={`orbit-curtain ${ready ? "is-clear" : ""}`} aria-hidden>
        <div className="space-layer space-stars space-stars-1" />
        <div className="space-layer space-stars space-stars-2" />
        <div className="space-layer space-stars space-stars-3" />
      </div>
    </div>
  );
}
