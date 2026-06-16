"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

export const MODEL_IDLE_URL = "/me/super-josh.glb";
export const MODEL_RUN_URL = "/me/model-run.glb";
export const MODEL_DANCE_URL = "/me/model-dance.glb";
// Shown only while the user hovers the "Personal AI Projects" mission card.
// The run/dance variants are used when hovering while that pose is active.
export const MODEL_PERSONAL_URL = "/me/personal-avatar.glb";
export const MODEL_PERSONAL_RUN_URL = "/me/personal-run.glb";
export const MODEL_PERSONAL_DANCE_URL = "/me/personal-dance.glb";
// Shown while hovering the "OneSignal AI Projects" mission card.
export const MODEL_ONESIGNAL_URL = "/me/onesignal-ai.glb";
// How long the turntable stays paused after the user lets go of a drag.
const RESUME_DELAY_MS = 1500;

// Loads a rigged GLB avatar, plays its baked animation, normalizes scale by
// height so it fills the framed viewport regardless of pose, and slowly turns
// it like a hologram on a turntable.
export function AvatarModel({
  url,
  spinToken = 0,
}: {
  url: string;
  // Bump to trigger a fast spin burst (e.g. when the mission selection flips).
  spinToken?: number;
}) {
  const spinRef = useRef<THREE.Group>(null);
  const draggingRef = useRef(false);
  const lastInteractRef = useRef(0);
  // Extra angular velocity (rad/s) that decays back to the idle turntable speed.
  const boostRef = useRef(0);
  const firstSpinRef = useRef(true);
  const gl = useThree((state) => state.gl);
  const { scene, animations } = useGLTF(url);

  const { object, scale, centerY } = useMemo(() => {
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
    obj.position.set(-center.x, -center.y, -center.z); // initial bind-pose center
    // Frame by height so a wide running pose fills the viewport like the
    // standing idle pose (limb spread no longer shrinks the figure).
    const height = size.y || 1;
    const target = 3.0; // full-body figure framed within the viewport
    return { object: obj, scale: target / height, centerY: center.y };
  }, [scene]);

  const { actions, names, mixer } = useAnimations(animations, object);

  useEffect(() => {
    const action = names.length ? actions[names[0]] : undefined;
    if (!action) return;
    action.reset().fadeIn(0.4).play();

    // Recenter the spin axis on the *posed* skeleton. The baked animation can
    // translate the Hips sideways (Avaturn's "Pose1" shifts X by ~0.23), so
    // centering on the bind pose leaves the figure orbiting a point off to its
    // side. Apply the pose, then pin the Hips X/Z to the origin; keep the
    // bind-pose vertical center for stable framing.
    const hips = object.getObjectByName("Hips");
    if (hips) {
      mixer.update(0); // flush the pose so bone transforms are current
      object.updateWorldMatrix(true, true);
      const hipsWorld = new THREE.Vector3().setFromMatrixPosition(hips.matrixWorld);
      // Express the Hips in the model's own local frame so the offset is
      // independent of the outer spin/scale groups.
      const inv = new THREE.Matrix4().copy(object.matrixWorld).invert();
      const hipsLocal = hipsWorld.applyMatrix4(inv);
      object.position.set(-hipsLocal.x, -centerY, -hipsLocal.z);
    }

    return () => {
      action.fadeOut(0.2);
    };
  }, [actions, names, object, mixer, centerY]);

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

  // A changing spinToken kicks off a fast spin burst (skip the initial mount).
  useEffect(() => {
    if (firstSpinRef.current) {
      firstSpinRef.current = false;
      return;
    }
    boostRef.current = 55; // rad/s — ~2 quick revolutions before it settles
  }, [spinToken]);

  // Whenever the model itself swaps, snap the turntable back to front and clear
  // any spin momentum so the new avatar always arrives in the front-facing pose.
  useEffect(() => {
    if (spinRef.current) spinRef.current.rotation.y = 0;
    boostRef.current = 0;
  }, [url]);

  useFrame((_, delta) => {
    if (!spinRef.current) return;
    const idle =
      !draggingRef.current &&
      performance.now() - lastInteractRef.current > RESUME_DELAY_MS;
    if (idle) spinRef.current.rotation.y += delta * 0.35;
    // Fast spin burst, decaying exponentially back to the idle turntable.
    if (boostRef.current > 0.01) {
      spinRef.current.rotation.y += delta * boostRef.current;
      boostRef.current *= Math.exp(-delta * 4.5);
    }
  });

  return (
    <group ref={spinRef} scale={scale}>
      <primitive object={object} />
    </group>
  );
}

useGLTF.preload(MODEL_IDLE_URL);
useGLTF.preload(MODEL_RUN_URL);
useGLTF.preload(MODEL_DANCE_URL);
useGLTF.preload(MODEL_PERSONAL_URL);
useGLTF.preload(MODEL_PERSONAL_RUN_URL);
useGLTF.preload(MODEL_PERSONAL_DANCE_URL);
useGLTF.preload(MODEL_ONESIGNAL_URL);
