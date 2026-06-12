"use client";

import { useFrame } from "@react-three/fiber";
import { MutableRefObject } from "react";
import { Project } from "@/lib/store/types";
import { Satellite } from "./satellite";
import { globeStore } from "./use-globe-store";

export function Satellites({
  projects,
  timeRef,
}: {
  projects: Project[];
  timeRef: MutableRefObject<number>;
}) {
  useFrame((_, delta) => {
    if (!globeStore.getSnapshot().paused) {
      timeRef.current += delta;
    }
  });

  return (
    <group>
      {projects.map((project) => (
        <Satellite key={project.slug} project={project} timeRef={timeRef} />
      ))}
    </group>
  );
}
