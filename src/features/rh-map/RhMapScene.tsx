import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, RoundedBox } from "@react-three/drei";
import { CameraRig, cameraPositionFor } from "@/spatial/three/CameraRig";
import { SpatialRoom } from "@/spatial/three/SpatialRoom";
import type { SpatialObject, Vec3 } from "@/spatial/types";
import { findOccupant, occupantWorldPosition, sceneRadius } from "./teams-to-objects";

const ORIGIN: Vec3 = [0, 0, 0];

export default function RhMapScene({
  objects,
  selectedId,
  selectedOccupantId,
  onSelect,
  onSelectOccupant,
  reducedMotion,
}: {
  objects: SpatialObject[];
  selectedId: string | null;
  selectedOccupantId: string | null;
  onSelect: (id: string | null) => void;
  onSelectOccupant: (teamObjectId: string, occupantId: string) => void;
  reducedMotion: boolean;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const orbiting = useRef(false);
  const radius = useMemo(() => sceneRadius(objects), [objects]);
  const overviewDistance = radius * 1.85 + 5;
  const floorSize = radius * 2 + 3;

  const selected = objects.find((o) => o.id === selectedId) ?? null;
  const occupantHit = findOccupant(objects, selectedOccupantId);
  const occupantTarget = occupantHit
    ? occupantWorldPosition(occupantHit.object, occupantHit.occupant.id)
    : null;
  const target: Vec3 = occupantTarget
    ? occupantTarget
    : selected
      ? [selected.position[0], 0.48, selected.position[2]]
      : ORIGIN;
  const distance = occupantTarget ? 1.85 : selected ? 3.4 : overviewDistance;

  useEffect(() => () => void (document.body.style.cursor = ""), []);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 32, near: 0.1, far: 200, position: cameraPositionFor(ORIGIN, overviewDistance) }}
      onPointerMissed={() => {
        if (orbiting.current) return;
        onSelect(null);
      }}
    >
      <ambientLight intensity={0.78} />
      <hemisphereLight args={["#fff8f0", "#c9d4e2", 0.55]} />
      <directionalLight
        position={[6, 10, 8]}
        intensity={1.55}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-5, 4, -3]} intensity={0.45} color="#d7e6f5" />
      <directionalLight position={[2, 3, 6]} intensity={0.35} color="#ffe8d2" />

      <CameraRig
        target={target}
        distance={distance}
        maxDistance={Math.max(18, overviewDistance * 1.45)}
        reducedMotion={reducedMotion}
        onOrbitStart={() => {
          orbiting.current = true;
        }}
        onOrbitEnd={() => {
          window.setTimeout(() => {
            orbiting.current = false;
          }, 40);
        }}
      />

      <RoundedBox args={[floorSize, 0.3, floorSize]} radius={0.4} smoothness={4} position={[0, -0.16, 0]} receiveShadow>
        <meshStandardMaterial color="#efe6d3" roughness={1} />
      </RoundedBox>

      {objects.map((object) => (
        <SpatialRoom
          key={object.id}
          object={object}
          selected={object.id === selectedId && !selectedOccupantId}
          hovered={object.id === hoveredId}
          selectedOccupantId={selectedOccupantId}
          reducedMotion={reducedMotion}
          onSelect={onSelect}
          onSelectOccupant={onSelectOccupant}
          onHover={setHoveredId}
        />
      ))}

      <ContactShadows
        position={[0, 0.001, 0]}
        scale={floorSize}
        resolution={512}
        blur={2.4}
        opacity={0.32}
        far={4}
        color="#4a6a8a"
      />
    </Canvas>
  );
}
