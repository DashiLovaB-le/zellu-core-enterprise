import { useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group } from "three";

const SKIN = ["#3b2a24", "#6b4634", "#c48a62", "#e7c2a4", "#f3dcc8"] as const;

const OUTFITS = [
  { shirt: "#e8a24a", shorts: "#3d4554", hat: "#6db7c4", band: "#e25b4a", shoes: "#c45c4a" },
  { shirt: "#e5987d", shorts: "#4d332d", hat: "#92a085", band: "#d48468", shoes: "#7ea8cf" },
  { shirt: "#7ea8cf", shorts: "#3a4a5c", hat: "#e2c27a", band: "#e5987d", shoes: "#92a085" },
  { shirt: "#92a085", shorts: "#3d4554", hat: "#d4a5c0", band: "#7ea8cf", shoes: "#e8a24a" },
  { shirt: "#d4a5c0", shorts: "#4d332d", hat: "#6db7c4", band: "#e25b4a", shoes: "#e5987d" },
  { shirt: "#e2c27a", shorts: "#5b4a3a", hat: "#7ea8cf", band: "#92a085", shoes: "#3d4554" },
] as const;

const HAIR = ["#2a1c16", "#5a3824", "#c4a35a", "#1a1614", "#8b3a2a"] as const;
const FROST = {
  skin: "#c9ced8",
  shirt: "#b4bac6",
  shorts: "#9aa1ad",
  hat: "#d5dae3",
  band: "#aeb4c0",
  shoes: "#8f96a3",
  hair: "#9aa1ad",
};

const CURLS: Array<[number, number, number, number]> = [
  [0, 0.1, -0.015, 0.052],
  [0.055, 0.078, 0.018, 0.044],
  [-0.055, 0.078, 0.018, 0.044],
  [0.072, 0.055, -0.035, 0.042],
  [-0.072, 0.055, -0.035, 0.042],
  [0.028, 0.048, -0.062, 0.04],
  [-0.028, 0.048, -0.062, 0.04],
];

function pick<T>(list: readonly T[], n: number): T {
  return list[Math.abs(n) % list.length];
}

function Vinyl({
  color,
  roughness = 0.46,
}: {
  color: string;
  roughness?: number;
}) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={roughness}
      metalness={0}
      clearcoat={0.28}
      clearcoatRoughness={0.48}
      sheen={0.42}
      sheenRoughness={0.55}
      sheenColor="#fff6ea"
    />
  );
}

export function ClayFigure({
  seed,
  anonymous,
  reducedMotion,
  position,
  yaw = 0.28,
  selected = false,
  label,
  onSelect,
}: {
  seed: number;
  anonymous: boolean;
  reducedMotion: boolean;
  position: [number, number, number];
  yaw?: number;
  selected?: boolean;
  label?: string | null;
  onSelect?: () => void;
}) {
  const group = useRef<Group>(null);
  const outfit = anonymous ? FROST : pick(OUTFITS, seed >> 3);
  const skin = anonymous ? FROST.skin : pick(SKIN, seed);
  const hair = anonymous ? FROST.hair : pick(HAIR, seed >> 6);
  const style = seed % 3;
  const phase = (seed % 1000) / 159;
  const scale = useMemo(() => 1.05 + ((seed >>> 8) % 10) / 110, [seed]);

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const bob = reducedMotion ? 0 : Math.sin(clock.getElapsedTime() * 1.12 + phase) * 0.006;
    g.position.y = position[1] + bob;
  });

  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = onSelect ? "pointer" : "default";
  };
  const handleOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = "";
  };
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect?.();
  };

  return (
    <group
      ref={group}
      position={position}
      scale={scale * (selected ? 1.06 : 1)}
      rotation={[0, yaw, 0]}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
      onClick={handleClick}
    >
      {selected && (
        <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.11, 0.145, 32]} />
          <meshBasicMaterial color="#4a6a8a" transparent opacity={0.55} />
        </mesh>
      )}

      {/* Shoes — flat ovals on the floor, stepped slightly forward */}
      <mesh position={[-0.04, 0.015, 0.032]} scale={[1.45, 0.38, 1.9]} castShadow>
        <sphereGeometry args={[0.032, 20, 14]} />
        <Vinyl color={outfit.shoes} roughness={0.55} />
      </mesh>
      <mesh position={[0.04, 0.015, 0.032]} scale={[1.45, 0.38, 1.9]} castShadow>
        <sphereGeometry args={[0.032, 20, 14]} />
        <Vinyl color={outfit.shoes} roughness={0.55} />
      </mesh>

      {/* Legs: long vertical capsules from ankle to hip */}
      <mesh position={[-0.038, 0.128, 0.01]} castShadow>
        <capsuleGeometry args={[0.02, 0.168, 6, 14]} />
        <Vinyl color={skin} roughness={0.5} />
      </mesh>
      <mesh position={[0.038, 0.128, 0.01]} castShadow>
        <capsuleGeometry args={[0.02, 0.168, 6, 14]} />
        <Vinyl color={skin} roughness={0.5} />
      </mesh>

      {/* Pelvis / shorts — small, does not swallow the legs */}
      <mesh position={[0, 0.236, 0.008]} scale={[1.12, 0.52, 0.92]} castShadow>
        <sphereGeometry args={[0.046, 24, 16]} />
        <Vinyl color={outfit.shorts} />
      </mesh>

      {/* Torso: vertical capsule, taller than wide — the waist reads between pelvis and chest */}
      <mesh position={[0, 0.355, 0.012]} scale={[1.08, 1, 0.82]} castShadow>
        <capsuleGeometry args={[0.048, 0.092, 8, 18]} />
        <Vinyl color={outfit.shirt} />
      </mesh>

      {/* Arms hang from the shoulders */}
      <mesh position={[-0.078, 0.348, 0.02]} rotation={[0.18, 0, 0.38]} castShadow>
        <capsuleGeometry args={[0.017, 0.125, 6, 12]} />
        <Vinyl color={skin} roughness={0.5} />
      </mesh>
      <mesh position={[0.078, 0.348, 0.02]} rotation={[0.18, 0, -0.38]} castShadow>
        <capsuleGeometry args={[0.017, 0.125, 6, 12]} />
        <Vinyl color={skin} roughness={0.5} />
      </mesh>
      <mesh position={[-0.108, 0.268, 0.048]} castShadow>
        <sphereGeometry args={[0.022, 14, 12]} />
        <Vinyl color={skin} roughness={0.5} />
      </mesh>
      <mesh position={[0.108, 0.268, 0.048]} castShadow>
        <sphereGeometry args={[0.022, 14, 12]} />
        <Vinyl color={skin} roughness={0.5} />
      </mesh>

      <mesh position={[0, 0.458, 0.01]} castShadow>
        <capsuleGeometry args={[0.02, 0.028, 6, 12]} />
        <Vinyl color={skin} roughness={0.5} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.588, 0]} castShadow>
        <sphereGeometry args={[0.112, 40, 32]} />
        <Vinyl color={skin} roughness={0.5} />
      </mesh>
      <mesh position={[-0.104, 0.588, 0.008]} castShadow>
        <sphereGeometry args={[0.024, 14, 12]} />
        <Vinyl color={skin} roughness={0.5} />
      </mesh>
      <mesh position={[0.104, 0.588, 0.008]} castShadow>
        <sphereGeometry args={[0.024, 14, 12]} />
        <Vinyl color={skin} roughness={0.5} />
      </mesh>

      <mesh position={[-0.04, 0.592, 0.096]}>
        <sphereGeometry args={[0.036, 22, 16]} />
        <meshPhysicalMaterial color={anonymous ? "#e8eaef" : "#f7f4ef"} roughness={0.28} clearcoat={0.4} />
      </mesh>
      <mesh position={[0.04, 0.592, 0.096]}>
        <sphereGeometry args={[0.036, 22, 16]} />
        <meshPhysicalMaterial color={anonymous ? "#e8eaef" : "#f7f4ef"} roughness={0.28} clearcoat={0.4} />
      </mesh>
      {!anonymous && (
        <>
          <mesh position={[-0.038, 0.59, 0.122]}>
            <sphereGeometry args={[0.018, 14, 12]} />
            <meshStandardMaterial color="#1c1410" roughness={0.35} />
          </mesh>
          <mesh position={[0.038, 0.59, 0.122]}>
            <sphereGeometry args={[0.018, 14, 12]} />
            <meshStandardMaterial color="#1c1410" roughness={0.35} />
          </mesh>
          <mesh position={[-0.032, 0.6, 0.136]}>
            <sphereGeometry args={[0.006, 8, 8]} />
            <meshBasicMaterial color="#fff" />
          </mesh>
          <mesh position={[0.044, 0.6, 0.136]}>
            <sphereGeometry args={[0.006, 8, 8]} />
            <meshBasicMaterial color="#fff" />
          </mesh>
        </>
      )}

      {style === 0 && (
        <group position={[0, 0.668, -0.012]}>
          {CURLS.map(([x, y, z, r], i) => (
            <mesh key={i} position={[x, y, z]} castShadow>
              <sphereGeometry args={[r, 14, 12]} />
              <Vinyl color={hair} roughness={0.58} />
            </mesh>
          ))}
        </group>
      )}

      {style !== 0 && (
        <>
          <mesh position={[0, 0.655, -0.008]} castShadow>
            <sphereGeometry args={[0.1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2.35]} />
            <Vinyl color={outfit.hat} roughness={0.48} />
          </mesh>
          <mesh position={[0, 0.652, -0.008]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.1, 0.015, 10, 24]} />
            <Vinyl color={outfit.band} roughness={0.5} />
          </mesh>
        </>
      )}

      {selected && label && (
        <Html position={[0, 0.86, 0]} center distanceFactor={7} zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
          <span className="whitespace-nowrap rounded-full bg-[#4a6a8a] px-2.5 py-1 text-[11px] font-semibold text-white shadow-[0_2px_8px_rgba(74,106,138,0.25)]">
            {label}
          </span>
        </Html>
      )}
    </group>
  );
}
