"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { VisorPortrait } from "./visor-portrait";

const HOLO = "#6fe9d6";
const HOLO_DEEP = "#39b9c9";
const ACCENT = "#5ee0c8";
const HOLO_COLOR = new THREE.Color(HOLO);
const ACCENT_COLOR = new THREE.Color(ACCENT);
const WARN_COLOR = new THREE.Color("#ff8a5e");

export function Astronaut() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // Continuous slow spin + gentle float — a rotating holographic projection.
    groupRef.current.rotation.y += delta * 0.45;
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.05;
  });

  return (
    <group ref={groupRef}>
      {/* Helmet shell — translucent, glowing */}
      <mesh position={[0, 0.04, -0.48]}>
        <sphereGeometry args={[0.8, 48, 48]} />
        <meshStandardMaterial
          color={HOLO_DEEP}
          emissive={HOLO_COLOR}
          emissiveIntensity={0.45}
          transparent
          opacity={0.42}
          metalness={0.1}
          roughness={0.5}
          depthWrite={false}
        />
      </mesh>

      {/* Helmet opening rim (faces the camera, frames the visor) */}
      <mesh position={[0, 0.04, 0.46]}>
        <torusGeometry args={[0.6, 0.07, 20, 56]} />
        <meshStandardMaterial
          color={ACCENT}
          emissive={ACCENT_COLOR}
          emissiveIntensity={0.8}
          transparent
          opacity={0.85}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Face hologram on the visor */}
      <VisorPortrait />

      {/* Neck ring */}
      <mesh position={[0, -0.66, 0.04]}>
        <torusGeometry args={[0.26, 0.05, 16, 40]} />
        <meshStandardMaterial
          color={ACCENT}
          emissive={ACCENT_COLOR}
          emissiveIntensity={0.9}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Shoulders / upper torso */}
      <mesh position={[0, -1.28, 0]} scale={[1.3, 0.85, 1]}>
        <sphereGeometry args={[0.72, 40, 32]} />
        <meshStandardMaterial
          color={HOLO_DEEP}
          emissive={HOLO_COLOR}
          emissiveIntensity={0.4}
          transparent
          opacity={0.4}
          metalness={0.1}
          roughness={0.5}
          depthWrite={false}
        />
      </mesh>

      {/* Chest control panel */}
      <mesh position={[0, -1.05, 0.58]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[0.42, 0.24, 0.05]} />
        <meshStandardMaterial
          color={HOLO_DEEP}
          emissive={HOLO_COLOR}
          emissiveIntensity={0.5}
          transparent
          opacity={0.6}
        />
      </mesh>
      <mesh position={[-0.09, -1.03, 0.63]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[0.07, 0.07, 0.04]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT_COLOR} emissiveIntensity={1.4} />
      </mesh>
      <mesh position={[0.07, -1.03, 0.63]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[0.05, 0.05, 0.04]} />
        <meshStandardMaterial color="#ff8a5e" emissive={WARN_COLOR} emissiveIntensity={1.2} />
      </mesh>

      {/* Projector base ring — sells the "hologram" read */}
      <mesh position={[0, -1.95, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.7, 0.025, 12, 64]} />
        <meshStandardMaterial
          color={ACCENT}
          emissive={ACCENT_COLOR}
          emissiveIntensity={1.4}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}
