"use client";

import { useMemo } from "react";
import * as THREE from "three";

// The scene's key light (the "sun") shines from these directions; keep the sun
// billboard locked to the same vector so the lit limb of the Earth always points
// back at the visible sun. Mirrors globe-scene.tsx's <directionalLight>.
const SUN_DIR_NIGHT = new THREE.Vector3(-5, 2, -4.5);
const SUN_DIR_DAY = new THREE.Vector3(5, 2, 4.5);
// Far enough to sit beyond the drifting starfield (drei <Stars> reaches ~120)
// but well inside the Milky Way dome and the camera's far plane.
const SUN_DISTANCE = 170;

/** Soft radial-gradient sprite used for the sun's glow halos. */
function useGlowTexture() {
  return useMemo(() => {
    const size = 128;
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
      g.addColorStop(0.2, "rgba(255,244,214,0.85)");
      g.addColorStop(0.5, "rgba(255,224,170,0.35)");
      g.addColorStop(1, "rgba(255,210,150,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

/**
 * A distant sun: a crisp warm disk wrapped in two layered glow halos, parked far
 * out along the scene's light direction so it reads as the source of the Earth's
 * day/night terminator. Purely additive and depth-write-free so it never clips
 * the globe or the orbiting dots.
 */
export function Sun({ night = true }: { night?: boolean }) {
  const glow = useGlowTexture();
  const position = useMemo(() => {
    const dir = (night ? SUN_DIR_NIGHT : SUN_DIR_DAY).clone().normalize();
    return dir.multiplyScalar(SUN_DISTANCE);
  }, [night]);

  return (
    <group position={position}>
      {/* Broad outer corona. depthTest is set explicitly (not left to default)
          so the opaque Earth always occludes it — when the sun is behind the
          globe, none of this glow bleeds through the disk. */}
      <sprite scale={[120, 120, 1]}>
        <spriteMaterial
          map={glow}
          color="#ffd9a0"
          transparent
          opacity={0.28}
          depthWrite={false}
          depthTest
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
      {/* Tighter inner glow */}
      <sprite scale={[46, 46, 1]}>
        <spriteMaterial
          map={glow}
          color="#fff1cf"
          transparent
          opacity={0.6}
          depthWrite={false}
          depthTest
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
      {/* Crisp solar disk */}
      <mesh>
        <sphereGeometry args={[4.2, 32, 32]} />
        <meshBasicMaterial color="#fffaf0" toneMapped={false} depthTest />
      </mesh>
    </group>
  );
}

const MILKYWAY_VERTEX = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// A soft galactic band: brightness falls off with distance from the galactic
// plane, mottled by fbm noise for dust lanes, brightened toward a "core"
// direction. Additive over the black background so it stays a faint deep-space
// glow rather than a hard texture.
const MILKYWAY_FRAGMENT = /* glsl */ `
  varying vec3 vDir;
  uniform vec3 galNormal;
  uniform vec3 galCenter;
  uniform float intensity;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 dir = normalize(vDir);

    // Gaussian falloff from the galactic plane (b = 0 on the plane).
    float b = dot(dir, galNormal);
    float band = exp(-(b * b) / (2.0 * 0.05));

    // Mottled clouds + finer dust lanes carving into the band.
    float clouds = fbm(dir * 3.0);
    float lanes = fbm(dir * 9.0);
    float milk = band * (0.45 + 0.75 * clouds);
    milk *= (0.55 + 0.45 * smoothstep(0.15, 0.85, lanes));

    // Brighter bulge toward the galactic center.
    float core = pow(max(dot(dir, galCenter), 0.0), 6.0);
    milk += core * band * 0.9;

    // Cool blue-white arms, warmer core.
    vec3 coolCol = vec3(0.56, 0.64, 0.85);
    vec3 warmCol = vec3(0.95, 0.86, 0.72);
    vec3 col = mix(coolCol, warmCol, clamp(core, 0.0, 1.0));

    gl_FragColor = vec4(col * milk * intensity, 1.0);
  }
`;

/**
 * The Milky Way: a large inverted skydome shading a faint, dust-mottled galactic
 * band across the background. Sits at a huge radius (parallax-free relative to
 * the orbiting camera) behind the starfield, the sun, and the globe.
 */
export function MilkyWay() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          galNormal: { value: new THREE.Vector3(0.62, 0.66, 0.42).normalize() },
          galCenter: {
            value: new THREE.Vector3(-0.7, 0.05, -0.7).normalize(),
          },
          intensity: { value: 0.32 },
        },
        vertexShader: MILKYWAY_VERTEX,
        fragmentShader: MILKYWAY_FRAGMENT,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        depthTest: false,
      }),
    []
  );

  return (
    <mesh material={material} renderOrder={-10}>
      <sphereGeometry args={[400, 64, 64]} />
    </mesh>
  );
}
