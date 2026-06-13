import * as THREE from "three";
import { Project } from "@/lib/store/types";

export const EARTH_RADIUS = 1;

export type OrbitParams = {
  radius: number;
  inclination: number;
  ascendingNode: number;
  phase: number;
  speed: number;
};

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// Deterministic pseudo-random in [0, 1) seeded by a string + salt.
function seeded(value: string, salt: number): number {
  const h = hashString(`${value}:${salt}`);
  return (h % 100000) / 100000;
}

const SHELLS = [1.55, 1.9, 2.25, 2.6];

export function getOrbitParams(slug: string): OrbitParams {
  const shell = SHELLS[hashString(slug) % SHELLS.length];
  const radius = shell + seeded(slug, 1) * 0.12;
  const inclination = (seeded(slug, 2) - 0.5) * Math.PI * 0.9;
  const ascendingNode = seeded(slug, 3) * Math.PI * 2;
  const phase = seeded(slug, 4) * Math.PI * 2;
  const direction = seeded(slug, 5) > 0.5 ? 1 : -1;
  const speed = direction * (0.018 + seeded(slug, 6) * 0.032);
  return { radius, inclination, ascendingNode, phase, speed };
}

const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);

// Position along an orbit at an absolute angle (ignoring time/phase). Used to
// trace the full elliptical ring that a satellite sweeps so we can draw the
// woven "linework" of all orbits at once.
export function orbitPointAtAngle(
  params: OrbitParams,
  angle: number,
  target = new THREE.Vector3()
): THREE.Vector3 {
  target.set(
    Math.cos(angle) * params.radius,
    0,
    Math.sin(angle) * params.radius
  );
  target.applyAxisAngle(X_AXIS, params.inclination);
  target.applyAxisAngle(Y_AXIS, params.ascendingNode);
  return target;
}

export function orbitPosition(
  params: OrbitParams,
  time: number,
  target = new THREE.Vector3()
): THREE.Vector3 {
  const angle = params.phase + time * params.speed;
  target.set(
    Math.cos(angle) * params.radius,
    0,
    Math.sin(angle) * params.radius
  );
  target.applyAxisAngle(X_AXIS, params.inclination);
  target.applyAxisAngle(Y_AXIS, params.ascendingNode);
  return target;
}

// Section colors, kept in sync with the mission-card numbers on the landing
// screen: Releases = red, OneSignal AI = yellow, Personal = blue.
export function categoryColor(category: Project["category"]): string {
  switch (category) {
    case "onesignal-work":
      return "#f25f4c"; // red
    case "onesignal":
      return "#f5c542"; // yellow
    case "personal":
      return "#4f9dff"; // blue
    default:
      return "#4f9dff";
  }
}
