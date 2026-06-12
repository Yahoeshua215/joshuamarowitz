"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { EARTH_RADIUS } from "./orbits";
import { globeStore } from "./use-globe-store";

const ATMOSPHERE_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOSPHERE_FRAGMENT = /* glsl */ `
  varying vec3 vNormal;
  uniform vec3 glowColor;
  void main() {
    float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
    gl_FragColor = vec4(glowColor, 1.0) * intensity;
  }
`;

export function Earth({ night = true }: { night?: boolean }) {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  const [dayMap, normalMap, specularMap, cloudsMap, nightMap] = useTexture([
    "/textures/earth_day.jpg",
    "/textures/earth_normal.jpg",
    "/textures/earth_specular.jpg",
    "/textures/earth_clouds.png",
    "/textures/earth_night.jpg",
  ]);

  const atmosphereMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { glowColor: { value: new THREE.Color("#3a7bd5") } },
        vertexShader: ATMOSPHERE_VERTEX,
        fragmentShader: ATMOSPHERE_FRAGMENT,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
      }),
    []
  );

  useFrame((_, delta) => {
    if (globeStore.getSnapshot().paused) return;
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.03;
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.042;
  });

  return (
    <group>
      <mesh ref={earthRef}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial
          map={dayMap}
          normalMap={normalMap}
          roughnessMap={specularMap}
          metalness={0.1}
          roughness={0.85}
          emissiveMap={nightMap}
          emissive={new THREE.Color("#ffd9a0")}
          emissiveIntensity={night ? 0.9 : 0.05}
        />
      </mesh>

      <mesh ref={cloudsRef} scale={1.01}>
        <sphereGeometry args={[EARTH_RADIUS, 48, 48]} />
        <meshStandardMaterial
          map={cloudsMap}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>

      <mesh scale={1.18} material={atmosphereMaterial}>
        <sphereGeometry args={[EARTH_RADIUS, 48, 48]} />
      </mesh>
    </group>
  );
}
