"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

const FACE_SRC = "/me/face.png";
const DEPTH_SRC = "/me/face-depth.png";

// A featureless holographic bust used until a real photo is dropped in.
function makePlaceholderFace(): THREE.Texture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#06121a";
  ctx.fillRect(0, 0, size, size);

  // Soft head/shoulders silhouette glow.
  const grad = ctx.createRadialGradient(
    size / 2,
    size * 0.42,
    20,
    size / 2,
    size * 0.42,
    size * 0.5
  );
  grad.addColorStop(0, "rgba(94,224,200,0.55)");
  grad.addColorStop(1, "rgba(94,224,200,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(size / 2, size * 0.4, size * 0.22, size * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "600 22px monospace";
  ctx.textAlign = "center";
  ctx.fillText("ADD /me/face.png", size / 2, size * 0.9);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Radial falloff so the center bulges toward the camera when used as a
// displacement map — gives any photo a gentle 2.5D relief.
function makeRadialDepth(): THREE.Texture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size * 0.45,
    10,
    size / 2,
    size / 2,
    size * 0.6
  );
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.6, "#8a8a8a");
  grad.addColorStop(1, "#1a1a1a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

export function VisorPortrait() {
  const colorMap = useMemo(makePlaceholderFace, []);
  const depthMap = useMemo(makeRadialDepth, []);

  // Swap in the real photo / depth map if they exist, without ever leaving the
  // material with a null map (which would force a shader recompile).
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      FACE_SRC,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        colorMap.image = tex.image;
        colorMap.needsUpdate = true;
      },
      undefined,
      () => {}
    );
    loader.load(
      DEPTH_SRC,
      (tex) => {
        depthMap.image = tex.image;
        depthMap.needsUpdate = true;
      },
      undefined,
      () => {}
    );

    return () => {
      colorMap.dispose();
      depthMap.dispose();
    };
  }, [colorMap, depthMap]);

  return (
    <group position={[0, 0.04, 0.5]}>
      {/* Depth-displaced portrait — the "hologram" on the visor. */}
      <mesh>
        <planeGeometry args={[0.74, 0.88, 160, 160]} />
        <meshStandardMaterial
          map={colorMap}
          displacementMap={depthMap}
          displacementScale={0.16}
          emissive={new THREE.Color("#5ee0c8")}
          emissiveMap={colorMap}
          emissiveIntensity={0.18}
          roughness={0.85}
          metalness={0.05}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
