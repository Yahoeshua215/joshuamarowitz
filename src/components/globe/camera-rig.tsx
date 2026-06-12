"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { MutableRefObject, useEffect, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { getOrbitParams, orbitPosition } from "./orbits";
import { useGlobeStore } from "./use-globe-store";

const DEFAULT_CAM = new THREE.Vector3(0, 1.1, 8);
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0);
const UP_OFFSET = new THREE.Vector3(0, 0.25, 0);

type CameraRigProps = {
  controlsRef: MutableRefObject<OrbitControlsImpl | null>;
  timeRef: MutableRefObject<number>;
};

/**
 * Animates the camera only while focusing a satellite or easing back to the
 * default view. When idle, it releases control entirely so OrbitControls can
 * freely orbit/spin the globe.
 */
export function CameraRig({ controlsRef, timeRef }: CameraRigProps) {
  const { camera } = useThree();
  const { selectedSlug } = useGlobeStore();

  const modeRef = useRef<"idle" | "select" | "return">("idle");
  const desiredCam = useRef(new THREE.Vector3());
  const desiredTarget = useRef(new THREE.Vector3());
  const satPos = useRef(new THREE.Vector3());
  // Safety valve: a bounded number of frames the "return" ease may run before we
  // force-hand control back to the user, so controls can never stick disabled.
  const returnFrames = useRef(0);

  useEffect(() => {
    const controls = controlsRef.current;
    if (selectedSlug) {
      modeRef.current = "select";
      if (controls) controls.enabled = false;
    } else {
      // Easing back to the default view (or first mount). Disable input only for
      // the duration of the ease; the idle guard below re-enables it.
      modeRef.current = "return";
      returnFrames.current = 0;
      if (controls) controls.enabled = false;
    }
  }, [selectedSlug, controlsRef]);

  useFrame(() => {
    const controls = controlsRef.current;

    // Idle: no satellite focused. Guarantee the user can always orbit/zoom.
    // This is the recovery path — even if a transition glitched, sitting idle
    // with nothing selected must mean controls are live.
    if (modeRef.current === "idle") {
      if (controls && !selectedSlug && !controls.enabled) {
        controls.enabled = true;
      }
      return;
    }

    if (modeRef.current === "select" && selectedSlug) {
      orbitPosition(
        getOrbitParams(selectedSlug),
        timeRef.current,
        satPos.current
      );
      desiredTarget.current.copy(satPos.current);
      const dir = satPos.current.clone().normalize();
      desiredCam.current
        .copy(satPos.current)
        .addScaledVector(dir, 1.1)
        .add(UP_OFFSET);
    } else {
      desiredCam.current.copy(DEFAULT_CAM);
      desiredTarget.current.copy(DEFAULT_TARGET);
    }

    // Slower ease while flying in to a satellite for a cinematic zoom;
    // a touch quicker when easing back to the default view.
    const lerp = modeRef.current === "select" ? 0.055 : 0.08;
    camera.position.lerp(desiredCam.current, lerp);
    if (controls) {
      controls.target.lerp(desiredTarget.current, lerp);
      controls.update();
    }

    // Once we've eased back to the default view (or burned through the safety
    // budget), hand control to the user. Going idle while nothing is selected
    // always re-enables input via the guard above, so this can't get stuck.
    if (modeRef.current === "return") {
      returnFrames.current += 1;
      const arrived = camera.position.distanceTo(DEFAULT_CAM) < 0.05;
      if (arrived || returnFrames.current > 90) {
        camera.position.copy(DEFAULT_CAM);
        if (controls) {
          controls.target.copy(DEFAULT_TARGET);
          controls.enabled = true;
          controls.update();
        }
        modeRef.current = "idle";
      }
    }
  });

  return null;
}
