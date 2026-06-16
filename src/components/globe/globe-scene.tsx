"use client";

import { OrbitControls, Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { MISSION_CATEGORY_ORDER } from "@/components/landing/landing-data";
import { LogWeek } from "@/lib/log/types";
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
import { CaptainsLog } from "./captains-log";
import { DesignSystemHud } from "./design-system-hud";
import { Earth } from "./earth";
import { GlobeDrawer } from "./globe-drawer";
import { GlobeLegend } from "./globe-legend";
import { MissionControlReturn } from "./mission-control-return";
import { OrbitHeaderRail } from "./orbit-header-rail";
import { ProjectShowcase } from "./project-showcase";
import { SatelliteField } from "./satellite-field";
import { Satellites } from "./satellites";
import { MilkyWay, Sun } from "./space-backdrop";
import { globeStore, useGlobeStore } from "./use-globe-store";

const ALL_CATEGORIES = MISSION_CATEGORY_ORDER;

// Orbit visualization style. "dots" is the new glowing-dot + leader-line field;
// "models" is the original modeled satellites, kept around (tucked away) so we
// can switch back at any time.
const ORBIT_STYLE: "dots" | "models" = "dots";

export default function GlobeScene({
  projects,
  logWeeks = [],
  initialFocus = null,
}: {
  projects: Project[];
  logWeeks?: LogWeek[];
  initialFocus?: Project["category"] | null;
}) {
  const router = useRouter();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const timeRef = useRef(0);
  // Subscribe only to modalSlug — `paused` is driven imperatively onto
  // OrbitControls in CameraRig, so a click (which flips paused) no longer
  // re-renders this whole-scene component. modalSlug only changes ~1.5s after
  // the click (or on close), keeping the click frame free of a tree reconcile.
  const modalSlug = useGlobeStore((s) => s.modalSlug);
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
        {/* Deep-space backdrop: the galactic band, and the sun parked along the
            key-light direction so it reads as the source of the terminator. */}
        <MilkyWay />
        <Sun night={night} />
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
          autoRotateSpeed={0.35}
        />
        <CameraRig controlsRef={controlsRef} timeRef={timeRef} projects={projects} />
      </Canvas>
      </div>

      <MissionControlReturn onReturn={handleReturn} focus={soloCategory} />

      <GlobeLegend
        count={visibleProjects.length}
        active={active}
        onToggle={toggleCategory}
      />

      <DesignSystemHud />
      <OrbitHeaderRail>
        <GlobeDrawer projects={visibleProjects} />
        <CaptainsLog weeks={logWeeks} />
      </OrbitHeaderRail>
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
