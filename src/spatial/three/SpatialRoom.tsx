import { useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html, RoundedBox } from "@react-three/drei";
import type { Group } from "three";
import { STATUS_VISUALS } from "../status-visuals";
import type { SpatialObject } from "../types";
import { hash32, workstations } from "../clay/occupant-slots";
import { ClayFigure } from "./ClayFigure";
import { OfficeChair, OfficeDesk, OfficePlant } from "./OfficeSet";

const WALL_COLOR = "#f3eee4";
const WALL_HEIGHT = 1.05;
const WALL_THICKNESS = 0.1;
const PLATFORM_HEIGHT = 0.08;

export function SpatialRoom({
  object,
  selected,
  hovered,
  selectedOccupantId,
  reducedMotion,
  onSelect,
  onSelectOccupant,
  onHover,
}: {
  object: SpatialObject;
  selected: boolean;
  hovered: boolean;
  selectedOccupantId: string | null;
  reducedMotion: boolean;
  onSelect: (id: string) => void;
  onSelectOccupant: (teamObjectId: string, occupantId: string) => void;
  onHover: (id: string | null) => void;
}) {
  const visual = STATUS_VISUALS[object.status];
  const [w, d] = object.size;
  const group = useRef<Group>(null);
  const isProtected = object.status === "protected";
  const stations = workstations(object.occupants.length, w, d);
  const visible = object.occupants.slice(0, stations.length);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const lift = selected ? 0.06 : hovered ? 0.03 : 0;
    const k = reducedMotion ? 1 : 1 - Math.exp(-delta * 8);
    g.position.y += (object.position[1] + lift - g.position.y) * k;
  });

  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(object.id);
    document.body.style.cursor = "pointer";
  };
  const handleOut = () => {
    onHover(null);
    document.body.style.cursor = "";
  };
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(object.id);
  };

  return (
    <group
      ref={group}
      position={object.position}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
      onClick={handleClick}
    >
      <RoundedBox
        args={[w, PLATFORM_HEIGHT, d]}
        radius={0.08}
        smoothness={4}
        position={[0, PLATFORM_HEIGHT / 2, 0]}
        receiveShadow
      >
        <meshStandardMaterial color={visual.base} roughness={0.95} />
      </RoundedBox>
      <mesh position={[0, PLATFORM_HEIGHT + 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w * 0.92, d * 0.92]} />
        <meshStandardMaterial color="#d7c4a3" roughness={0.9} />
      </mesh>

      <RoundedBox
        args={[w, WALL_HEIGHT, WALL_THICKNESS]}
        radius={0.05}
        smoothness={3}
        position={[0, PLATFORM_HEIGHT + WALL_HEIGHT / 2, -d / 2 + WALL_THICKNESS / 2]}
      >
        <meshStandardMaterial color={WALL_COLOR} roughness={0.96} />
      </RoundedBox>
      <mesh position={[0, PLATFORM_HEIGHT + 0.72, -d / 2 + WALL_THICKNESS / 2 + 0.02]}>
        <planeGeometry args={[w * 0.42, 0.38]} />
        <meshStandardMaterial color="#c5d8ea" roughness={0.25} emissive="#b7cde0" emissiveIntensity={0.2} />
      </mesh>
      <RoundedBox
        args={[WALL_THICKNESS, WALL_HEIGHT, d]}
        radius={0.05}
        smoothness={3}
        position={[-w / 2 + WALL_THICKNESS / 2, PLATFORM_HEIGHT + WALL_HEIGHT / 2, 0]}
      >
        <meshStandardMaterial color={WALL_COLOR} roughness={0.96} />
      </RoundedBox>

      {stations.map((station, index) => {
        const occupant = visible[index];
        if (!occupant) return null;
        return (
          <group key={occupant.id}>
            <OfficeDesk position={[station.desk[0], PLATFORM_HEIGHT, station.desk[1]]} />
            <OfficeChair
              position={[station.chair[0], PLATFORM_HEIGHT, station.chair[1]]}
              yaw={Math.PI}
            />
            <ClayFigure
              seed={hash32(occupant.id)}
              anonymous={isProtected}
              reducedMotion={reducedMotion}
              position={[station.person[0], PLATFORM_HEIGHT, station.person[1]]}
              yaw={station.yaw}
              selected={selectedOccupantId === occupant.id}
              label={occupant.name}
              onSelect={() => onSelectOccupant(object.id, occupant.id)}
            />
          </group>
        );
      })}

      <OfficePlant position={[w / 2 - 0.32, PLATFORM_HEIGHT, -d / 2 + 0.32]} />

      {object.alertCount > 0 && !isProtected && (
        <group position={[w / 2 - 0.28, PLATFORM_HEIGHT + 0.02, d / 2 - 0.28]}>
          <mesh position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.028, 0.034, 0.22, 10]} />
            <meshPhysicalMaterial color="#e07a5f" roughness={0.85} metalness={0} sheen={0.3} />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.09, 16, 12]} />
            <meshPhysicalMaterial
              color="#e07a5f"
              roughness={0.7}
              metalness={0}
              emissive="#e07a5f"
              emissiveIntensity={0.25}
              sheen={0.4}
            />
          </mesh>
        </group>
      )}

      {isProtected && (
        <RoundedBox
          args={[w * 0.98, 1.15, d * 0.98]}
          radius={0.18}
          smoothness={4}
          position={[0, PLATFORM_HEIGHT + 0.55, 0]}
        >
          <meshPhysicalMaterial
            color="#eef0f5"
            transparent
            opacity={0.22}
            roughness={1}
            transmission={0.08}
            depthWrite={false}
          />
        </RoundedBox>
      )}

      {selected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.max(w, d) * 0.58, Math.max(w, d) * 0.64, 64]} />
          <meshBasicMaterial color="#4a6a8a" transparent opacity={0.32} />
        </mesh>
      )}

      <Html
        position={[0, PLATFORM_HEIGHT + 0.02, d / 2 + 0.42]}
        center
        distanceFactor={10}
        zIndexRange={[20, 0]}
        style={{ pointerEvents: "none" }}
      >
        <span
          className={`block whitespace-nowrap rounded-full px-3 py-1 font-display text-[13px] font-semibold shadow-[0_2px_8px_rgba(74,106,138,0.14)] transition-colors duration-200 ${
            selected || hovered
              ? "bg-[#4a6a8a] text-white"
              : "bg-white/90 text-[var(--clay-title)]"
          }`}
        >
          {object.label}
        </span>
      </Html>
    </group>
  );
}
