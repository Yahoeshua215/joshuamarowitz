"use client";

import { OrbitControls, Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useTheme } from "next-themes";
import { Suspense, useMemo, useRef, useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Project } from "@/lib/store/types";
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
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const timeRef = useRef(0);
  const { modalSlug, paused } = useGlobeStore();
  const { resolvedTheme } = useTheme();

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

  // Default to the dark (night) side until the theme resolves on the client.
  const night = resolvedTheme !== "light";
  const background = night ? "#05070d" : "#0a1326";

  const modalProject =
    projects.find((p) => p.slug === modalSlug) ?? null;

  return (
    <div className="fixed inset-0 z-0" style={{ backgroundColor: background }}>
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

      <MissionControlReturn />

      <GlobeLegend
        count={visibleProjects.length}
        active={active}
        onToggle={toggleCategory}
      />
      <GlobeDrawer projects={visibleProjects} />

      {modalProject && (
        <ProjectShowcase project={modalProject} onClose={() => globeStore.clear()} />
      )}
    </div>
  );
}
