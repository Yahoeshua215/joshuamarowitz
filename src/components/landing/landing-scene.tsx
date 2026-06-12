"use client";

import { Environment, PresentationControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { AvatarModel } from "./avatar-model";

export default function LandingScene({
  modelUrl,
  interactive = true,
}: {
  modelUrl: string;
  // When false (e.g. the small orbit "return" widget), the avatar just
  // auto-spins and pointer drag-to-rotate is disabled so clicks pass through.
  interactive?: boolean;
}) {
  return (
    <Canvas
      style={{ position: "absolute", inset: 0 }}
      dpr={[1, 2]}
      camera={{ position: [0, 0, 4.5], fov: 40 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[0, 1.5, 5]} intensity={2.6} color="#ffffff" />
      <directionalLight position={[2.5, 3, 4]} intensity={2} color="#fff4e6" />
      <directionalLight position={[-3, 1, -4]} intensity={1.8} color="#5ee0c8" />
      <pointLight position={[0, -1, 3]} intensity={5} distance={8} color="#7fe9ff" />

      <Suspense fallback={null}>
        {/* Image-based lighting so the model's PBR materials read correctly. */}
        <Environment preset="city" environmentIntensity={0.8} />
        {interactive ? (
          // Drag to spin the avatar; free horizontally, gently clamped vertically.
          <PresentationControls
            global
            cursor={false}
            snap={false}
            speed={1.4}
            polar={[-0.15, 0.25]}
            azimuth={[-Infinity, Infinity]}
            damping={0.25}
          >
            <AvatarModel url={modelUrl} />
          </PresentationControls>
        ) : (
          <AvatarModel url={modelUrl} />
        )}
      </Suspense>
    </Canvas>
  );
}
