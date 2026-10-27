import { useEffect, useMemo, useRef } from "react";
import type { ComponentRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";
import type { Vec3 } from "../types";

/** Default isometric-like viewing direction for focus moves. */
export const VIEW_DIRECTION = new Vector3(1, 1.05, 1.45).normalize();

export function cameraPositionFor(target: Vec3, distance: number): Vec3 {
  return [
    target[0] + VIEW_DIRECTION.x * distance,
    target[1] + VIEW_DIRECTION.y * distance,
    target[2] + VIEW_DIRECTION.z * distance,
  ];
}

export function CameraRig({
  target,
  distance,
  maxDistance,
  reducedMotion,
  onOrbitStart,
  onOrbitEnd,
}: {
  target: Vec3;
  distance: number;
  maxDistance: number;
  reducedMotion: boolean;
  onOrbitStart?: () => void;
  onOrbitEnd?: () => void;
}) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const camera = useThree((s) => s.camera);
  const flying = useRef(false);
  const progress = useRef(1);
  const fromPos = useMemo(() => new Vector3(), []);
  const toPos = useMemo(() => new Vector3(), []);
  const fromLook = useMemo(() => new Vector3(), []);
  const toLook = useMemo(() => new Vector3(), []);
  const focusKey = useRef("");

  useEffect(() => {
    const key = `${target[0].toFixed(3)}:${target[1].toFixed(3)}:${target[2].toFixed(3)}:${distance.toFixed(3)}`;
    if (key === focusKey.current) return;
    focusKey.current = key;
    const dest = cameraPositionFor(target, distance);
    const ctrl = controls.current;
    if (!ctrl) {
      camera.position.set(...dest);
      return;
    }
    if (reducedMotion) {
      camera.position.set(...dest);
      ctrl.target.set(...target);
      ctrl.update();
      flying.current = false;
      return;
    }
    fromPos.copy(camera.position);
    toPos.set(...dest);
    fromLook.copy(ctrl.target);
    toLook.set(...target);
    progress.current = 0;
    flying.current = true;
  }, [camera, distance, reducedMotion, target, fromLook, fromPos, toLook, toPos]);

  useFrame((_, delta) => {
    const ctrl = controls.current;
    if (!flying.current || !ctrl) return;
    progress.current = Math.min(1, progress.current + delta / 0.5);
    const e = 1 - (1 - progress.current) ** 3;
    camera.position.lerpVectors(fromPos, toPos, e);
    ctrl.target.lerpVectors(fromLook, toLook, e);
    ctrl.update();
    if (progress.current >= 1) flying.current = false;
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan
      enableZoom
      enableRotate
      minDistance={1.5}
      maxDistance={maxDistance}
      minPolarAngle={0.32}
      maxPolarAngle={Math.PI / 2.08}
      zoomSpeed={0.85}
      rotateSpeed={0.7}
      panSpeed={0.7}
      onStart={() => {
        flying.current = false;
        onOrbitStart?.();
      }}
      onEnd={() => onOrbitEnd?.()}
    />
  );
}
