"use client";

import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Project } from "@/lib/store/types";
import {
  categoryColor,
  getOrbitParams,
  orbitPointAtAngle,
  orbitPosition,
} from "./orbits";
import { globeStore, useGlobeStore } from "./use-globe-store";

const RING_SEGMENTS = 96;
// How close (in screen pixels) the cursor must get to a dot to "hover" it.
const HOVER_PX = 34;
// Pointer travel beyond this (px) between down/up counts as a drag, not a click.
const CLICK_SLOP = 6;

/**
 * A soft radial-gradient sprite texture used as the glow halo behind each dot.
 * Built once on the client (the orbit scene only renders client-side).
 */
function useGlowTexture() {
  return useMemo(() => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(
        size / 2,
        size / 2,
        0,
        size / 2,
        size / 2,
        size / 2
      );
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.25, "rgba(255,255,255,0.55)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

/**
 * Faint elliptical rings tracing every visible orbit, merged into a single
 * line-segment geometry. Together they weave the circular "linework" pattern.
 */
function OrbitRings({ projects }: { projects: Project[] }) {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    const point = new THREE.Vector3();
    const ring: THREE.Vector3[] = [];

    for (const project of projects) {
      const params = getOrbitParams(project.slug);
      ring.length = 0;
      for (let i = 0; i <= RING_SEGMENTS; i++) {
        const angle = (i / RING_SEGMENTS) * Math.PI * 2;
        orbitPointAtAngle(params, angle, point);
        ring.push(point.clone());
      }
      for (let i = 0; i < RING_SEGMENTS; i++) {
        const a = ring[i];
        const b = ring[i + 1];
        positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    return geo;
  }, [projects]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        color="#bcd8f0"
        transparent
        opacity={0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </lineSegments>
  );
}

/**
 * Purely visual dot: a crisp colored core, a soft glow halo, and (when active)
 * a leader line extending out to its label. It carries NO pointer handlers, so
 * it never intercepts drags meant for OrbitControls — hover and click are
 * resolved by the parent via screen-space proximity instead.
 */
function SatelliteDot({
  project,
  timeRef,
  glow,
  active,
}: {
  project: Project;
  timeRef: MutableRefObject<number>;
  glow: THREE.Texture;
  active: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Sprite>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const params = useRef(getOrbitParams(project.slug)).current;
  const color = useMemo(
    () => categoryColor(project.category),
    [project.category]
  );

  useFrame(() => {
    if (groupRef.current) {
      orbitPosition(params, timeRef.current, groupRef.current.position);
    }
    if (haloRef.current) {
      const target = active ? 0.17 : 0.085;
      const next = THREE.MathUtils.lerp(haloRef.current.scale.x, target, 0.18);
      haloRef.current.scale.setScalar(next);
      const mat = haloRef.current.material as THREE.SpriteMaterial;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, active ? 1 : 0.7, 0.18);
    }
    if (coreRef.current) {
      const target = active ? 0.022 : 0.015;
      const next = THREE.MathUtils.lerp(coreRef.current.scale.x, target, 0.2);
      coreRef.current.scale.setScalar(next);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Crisp core (unit sphere scaled in useFrame so hover can pulse it) */}
      <mesh ref={coreRef} scale={0.015}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>

      {/* Soft glow halo */}
      <sprite ref={haloRef} scale={0.085}>
        <spriteMaterial
          map={glow}
          color={color}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.7}
          toneMapped={false}
        />
      </sprite>

      {active && (
        <Html
          position={[0, 0, 0]}
          zIndexRange={[40, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="sat-leader" style={{ "--c": color } as React.CSSProperties}>
            <span className="sat-leader-line" />
            <span className="sat-leader-label">{project.title}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * The "dot field" visualization: a woven web of faint orbit rings dotted with
 * glowing, category-colored satellites. Hovering near a dot extends a leader
 * line out to its label; a clean click selects it. All interaction is resolved
 * via screen-space proximity on a passive canvas listener, so the field never
 * blocks OrbitControls (drag to rotate, wheel to zoom). Drop-in replacement for
 * the modeled <Satellites>.
 */
export function SatelliteField({
  projects,
  timeRef,
}: {
  projects: Project[];
  timeRef: MutableRefObject<number>;
}) {
  const glow = useGlowTexture();
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);

  const { selectedSlug } = useGlobeStore();
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const hoveredRef = useRef<string | null>(null);

  // Stable per-dot orbit params for hit-testing.
  const metas = useMemo(
    () => projects.map((p) => ({ slug: p.slug, params: getOrbitParams(p.slug) })),
    [projects]
  );

  const pointer = useRef({ x: 0, y: 0, inside: false });
  const down = useRef({ x: 0, y: 0, t: 0, moved: false });

  useEffect(() => {
    const el = gl.domElement;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      pointer.current.x = e.clientX - rect.left;
      pointer.current.y = e.clientY - rect.top;
      pointer.current.inside = true;
      if (
        down.current.t &&
        Math.hypot(e.clientX - down.current.x, e.clientY - down.current.y) >
          CLICK_SLOP
      ) {
        down.current.moved = true;
      }
    };
    const onLeave = () => {
      pointer.current.inside = false;
    };
    const onDown = (e: PointerEvent) => {
      down.current = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
    };
    const onUp = () => {
      const wasClick =
        down.current.t > 0 &&
        !down.current.moved &&
        performance.now() - down.current.t < 600;
      down.current.t = 0;
      if (!wasClick) return;
      // A clean click selects the nearest dot, or clears when on empty space.
      if (hoveredRef.current) {
        globeStore.select(hoveredRef.current);
      } else {
        globeStore.clear();
      }
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
    };
  }, [gl]);

  const projected = useRef(new THREE.Vector3()).current;

  useFrame((_, delta) => {
    if (!globeStore.getSnapshot().paused) {
      timeRef.current += delta;
    }

    let best: string | null = null;
    let bestDist = HOVER_PX;
    if (pointer.current.inside) {
      for (const meta of metas) {
        orbitPosition(meta.params, timeRef.current, projected);
        projected.project(camera);
        if (projected.z > 1) continue; // behind the camera
        const sx = (projected.x * 0.5 + 0.5) * size.width;
        const sy = (-projected.y * 0.5 + 0.5) * size.height;
        const d = Math.hypot(sx - pointer.current.x, sy - pointer.current.y);
        if (d < bestDist) {
          bestDist = d;
          best = meta.slug;
        }
      }
    }

    if (best !== hoveredRef.current) {
      hoveredRef.current = best;
      setHoveredSlug(best);
      document.body.style.cursor = best ? "pointer" : "auto";
    }
  });

  // Clear the cursor override when unmounting.
  useEffect(
    () => () => {
      document.body.style.cursor = "auto";
    },
    []
  );

  return (
    <group>
      <OrbitRings projects={projects} />
      {projects.map((project) => (
        <SatelliteDot
          key={project.slug}
          project={project}
          timeRef={timeRef}
          glow={glow}
          active={hoveredSlug === project.slug || selectedSlug === project.slug}
        />
      ))}
    </group>
  );
}
