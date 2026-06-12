"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { Project } from "@/lib/store/types";
import {
  categoryColor,
  EARTH_RADIUS,
  getOrbitParams,
  orbitPosition,
} from "./orbits";
import { globeStore, useGlobeStore } from "./use-globe-store";

type SatelliteProps = {
  project: Project;
  timeRef: { current: number };
};

export function Satellite({ project, timeRef }: SatelliteProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const params = useRef(getOrbitParams(project.slug)).current;
  const color = categoryColor(project.category);
  const [hovered, setHovered] = useState(false);
  // Whether the satellite is currently passing in front of the Earth's disk.
  const [inFront, setInFront] = useState(false);
  const inFrontRef = useRef(false);
  const viewDir = useRef(new THREE.Vector3());
  const perp = useRef(new THREE.Vector3());

  const { selectedSlug } = useGlobeStore();
  const isSelected = selectedSlug === project.slug;

  useFrame((state) => {
    if (!groupRef.current) return;
    orbitPosition(params, timeRef.current, groupRef.current.position);
    if (bodyRef.current) {
      bodyRef.current.rotation.y += 0.01;
      const target = hovered || isSelected ? 1.7 : 1;
      const s = bodyRef.current.scale.x + (target - bodyRef.current.scale.x) * 0.2;
      bodyRef.current.scale.setScalar(s);
    }

    // Reveal the label only while the satellite passes in front of the Earth's
    // disk: it must be on the near side (closer to the camera than the Earth
    // center) and its perpendicular distance from the camera->Earth axis must
    // fall within the Earth's silhouette. Hysteresis avoids flicker, and we
    // suppress these while a satellite is selected so the modal stays clean.
    const paused = globeStore.getSnapshot().paused;
    const satPos = groupRef.current.position;
    const camDist = state.camera.position.length();
    // Axis from the camera toward the Earth center (origin).
    viewDir.current.copy(state.camera.position).multiplyScalar(-1).normalize();
    // Depth of the satellite along that axis, measured from the camera.
    const depth =
      satPos.x * viewDir.current.x +
      satPos.y * viewDir.current.y +
      satPos.z * viewDir.current.z -
      state.camera.position.dot(viewDir.current);
    const nearSide = depth > 0 && depth < camDist;
    // Perpendicular distance from the satellite to the camera->Earth axis.
    perp.current
      .copy(viewDir.current)
      .multiplyScalar(satPos.dot(viewDir.current))
      .subVectors(satPos, perp.current);
    const perpDist = perp.current.length();
    const overlaps = inFrontRef.current
      ? perpDist < EARTH_RADIUS * 1.15
      : perpDist < EARTH_RADIUS * 0.95;
    const next = !paused && nearSide && overlaps;
    if (next !== inFrontRef.current) {
      inFrontRef.current = next;
      setInFront(next);
    }
  });

  const emissiveIntensity = hovered || isSelected ? 1.6 : 0.6;

  return (
    <group ref={groupRef}>
      <group
        ref={bodyRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          globeStore.setHovered(project.slug);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          globeStore.setHovered(null);
          document.body.style.cursor = "auto";
        }}
        onClick={(e) => {
          e.stopPropagation();
          globeStore.select(project.slug);
        }}
      >
        {/* Generous invisible hit target for easy clicking */}
        <mesh visible={false}>
          <sphereGeometry args={[0.13, 8, 8]} />
          <meshBasicMaterial />
        </mesh>

        {/* Body */}
        <mesh castShadow>
          <boxGeometry args={[0.035, 0.035, 0.05]} />
          <meshStandardMaterial
            color="#cfd6e0"
            metalness={0.8}
            roughness={0.35}
            emissive={new THREE.Color(color)}
            emissiveIntensity={emissiveIntensity * 0.25}
          />
        </mesh>

        {/* Solar panels */}
        <mesh position={[0.075, 0, 0]}>
          <boxGeometry args={[0.08, 0.001, 0.035]} />
          <meshStandardMaterial
            color={color}
            emissive={new THREE.Color(color)}
            emissiveIntensity={emissiveIntensity}
            metalness={0.4}
            roughness={0.4}
          />
        </mesh>
        <mesh position={[-0.075, 0, 0]}>
          <boxGeometry args={[0.08, 0.001, 0.035]} />
          <meshStandardMaterial
            color={color}
            emissive={new THREE.Color(color)}
            emissiveIntensity={emissiveIntensity}
            metalness={0.4}
            roughness={0.4}
          />
        </mesh>

        {/* Strut */}
        <mesh>
          <boxGeometry args={[0.15, 0.004, 0.004]} />
          <meshStandardMaterial color="#8a8f98" metalness={0.6} roughness={0.5} />
        </mesh>

        {/* Dish */}
        <mesh position={[0, 0.028, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.018, 0.012, 12, 1, true]} />
          <meshStandardMaterial
            color="#e8edf2"
            metalness={0.5}
            roughness={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {(hovered || isSelected || inFront) && (
        <Html center distanceFactor={6} zIndexRange={[20, 0]}>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              globeStore.select(project.slug);
            }}
            onPointerOver={() => {
              setHovered(true);
              globeStore.setHovered(project.slug);
            }}
            onPointerOut={() => {
              setHovered(false);
              globeStore.setHovered(null);
            }}
            className={`-translate-y-8 cursor-pointer whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-medium backdrop-blur-sm transition-opacity hover:!opacity-100 ${
              hovered || isSelected
                ? "border-white/15 bg-black/70 text-white opacity-100"
                : "border-white/10 bg-black/45 text-white/75 opacity-70"
            }`}
          >
            {project.title}
          </button>
        </Html>
      )}
    </group>
  );
}
