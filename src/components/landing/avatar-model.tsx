"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

export const MODEL_IDLE_URL = "/me/model-idle.glb";
export const MODEL_RUN_URL = "/me/model-run.glb";
// How long the turntable stays paused after the user lets go of a drag.
const RESUME_DELAY_MS = 1500;

// Loads a rigged GLB avatar, plays its baked animation, normalizes scale by
// height so it fills the framed viewport regardless of pose, and slowly turns
// it like a hologram on a turntable.
export function AvatarModel({ url }: { url: string }) {
  const spinRef = useRef<THREE.Group>(null);
  const draggingRef = useRef(false);
  const lastInteractRef = useRef(0);
  const gl = useThree((state) => state.gl);
  const { scene, animations } = useGLTF(url);

  const { object, scale } = useMemo(() => {
    // SkeletonUtils.clone correctly rebinds skinned meshes to a cloned
    // skeleton (THREE's Object3D.clone does not), so the mesh renders.
    const obj = cloneSkeleton(scene);
    obj.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      // Skinned meshes can be wrongly frustum-culled after recentering/scaling.
      mesh.frustumCulled = false;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        const std = mat as THREE.MeshStandardMaterial;
        // Avaturn exports many surfaces as fully metallic, which renders dark
        // without a strong HDRI. Tone metalness down so direct lights read.
        if (typeof std.metalness === "number" && std.metalness > 0.3) {
          std.metalness = 0.2;
        }
        std.needsUpdate = true;
      }
    });
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    obj.position.sub(center); // recenter geometry around the origin
    // Frame by height so a wide running pose fills the viewport like the
    // standing idle pose (limb spread no longer shrinks the figure).
    const height = size.y || 1;
    const target = 3.0; // full-body figure framed within the viewport
    return { object: obj, scale: target / height };
  }, [scene]);

  const { actions, names } = useAnimations(animations, object);

  useEffect(() => {
    const action = names.length ? actions[names[0]] : undefined;
    if (!action) return;
    action.reset().fadeIn(0.4).play();
    return () => {
      action.fadeOut(0.2);
    };
  }, [actions, names]);

  // Pause the auto-spin while the user is dragging (and for a moment after).
  useEffect(() => {
    const el = gl.domElement;
    const onDown = () => {
      draggingRef.current = true;
      lastInteractRef.current = performance.now();
    };
    const onUp = () => {
      draggingRef.current = false;
      lastInteractRef.current = performance.now();
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [gl]);

  useFrame((_, delta) => {
    if (!spinRef.current) return;
    const idle =
      !draggingRef.current &&
      performance.now() - lastInteractRef.current > RESUME_DELAY_MS;
    if (idle) spinRef.current.rotation.y += delta * 0.35;
  });

  return (
    <group ref={spinRef} scale={scale}>
      <primitive object={object} />
    </group>
  );
}

useGLTF.preload(MODEL_IDLE_URL);
useGLTF.preload(MODEL_RUN_URL);
