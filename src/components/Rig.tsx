"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { easing } from "maath";
import * as THREE from "three";
import { THEORIES } from "@/lib/theories";

const HOME_POSITION = new THREE.Vector3(0, 4, 14);
const ORIGIN = new THREE.Vector3(0, 0, 0);

type Props = {
  activeId: string | null;
  controlsRef: React.RefObject<any>;
};

/**
 * Drives the camera: when a theory is active it eases right up to that sphere
 * and locks the orbit controls; when nothing is active it flies home and then
 * hands control back to the user for free orbiting.
 */
export function Rig({ activeId, controlsRef }: Props) {
  const { camera } = useThree();
  const state = useRef({ homing: false });

  // precompute focus targets so we don't allocate every frame
  const focusMap = useMemo(() => {
    const map = new Map<string, { camPos: THREE.Vector3; target: THREE.Vector3 }>();
    for (const t of THEORIES) {
      const target = new THREE.Vector3(...t.position);
      const camPos = target.clone().add(new THREE.Vector3(...t.camOffset));
      map.set(t.id, { camPos, target });
    }
    return map;
  }, []);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (activeId) {
      const focus = focusMap.get(activeId);
      if (!focus) return;
      state.current.homing = true;
      controls.enabled = false;
      easing.damp3(camera.position, focus.camPos, 0.55, delta);
      easing.damp3(controls.target, focus.target, 0.55, delta);
      controls.update();
    } else if (state.current.homing) {
      controls.enabled = false;
      easing.damp3(camera.position, HOME_POSITION, 0.7, delta);
      easing.damp3(controls.target, ORIGIN, 0.7, delta);
      controls.update();
      if (
        camera.position.distanceTo(HOME_POSITION) < 0.08 &&
        controls.target.distanceTo(ORIGIN) < 0.08
      ) {
        state.current.homing = false;
        controls.enabled = true;
      }
    } else {
      controls.enabled = true;
    }
  });

  return null;
}
