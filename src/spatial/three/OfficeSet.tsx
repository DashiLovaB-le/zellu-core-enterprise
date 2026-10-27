import { RoundedBox } from "@react-three/drei";

const WOOD = "#c4a06a";
const WOOD_DARK = "#8d6844";
const METAL = "#d5dbe4";
const SEAT = "#3d4a5c";
const SCREEN = "#1d2430";

export function OfficeDesk({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.7, 0.04, 0.4]} radius={0.02} smoothness={3} position={[0, 0.32, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={WOOD} roughness={0.72} />
      </RoundedBox>
      {(
        [
          [-0.3, 0.16, -0.16],
          [0.3, 0.16, -0.16],
          [-0.3, 0.16, 0.16],
          [0.3, 0.16, 0.16],
        ] as const
      ).map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <boxGeometry args={[0.035, 0.32, 0.035]} />
          <meshStandardMaterial color={WOOD_DARK} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 0.365, -0.08]}>
        <boxGeometry args={[0.08, 0.05, 0.04]} />
        <meshStandardMaterial color={METAL} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.48, -0.1]} castShadow>
        <boxGeometry args={[0.3, 0.18, 0.018]} />
        <meshStandardMaterial color={SCREEN} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.48, -0.092]}>
        <boxGeometry args={[0.27, 0.15, 0.004]} />
        <meshStandardMaterial color="#9eb7d0" roughness={0.2} emissive="#6f8eae" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[0, 0.342, 0.08]}>
        <boxGeometry args={[0.22, 0.008, 0.1]} />
        <meshStandardMaterial color="#ece7df" roughness={0.85} />
      </mesh>
    </group>
  );
}

export function OfficeChair({
  position,
  yaw = 0,
}: {
  position: [number, number, number];
  yaw?: number;
}) {
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.02, 12]} />
        <meshStandardMaterial color={METAL} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.16, 8]} />
        <meshStandardMaterial color={METAL} roughness={0.4} />
      </mesh>
      <RoundedBox args={[0.22, 0.04, 0.22]} radius={0.02} smoothness={3} position={[0, 0.2, 0]} castShadow>
        <meshStandardMaterial color={SEAT} roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[0.22, 0.26, 0.04]} radius={0.02} smoothness={3} position={[0, 0.34, -0.1]} castShadow>
        <meshStandardMaterial color={SEAT} roughness={0.7} />
      </RoundedBox>
    </group>
  );
}

export function OfficePlant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.07, 0.055, 0.16, 12]} />
        <meshStandardMaterial color="#c46b58" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.22, 0]} castShadow>
        <sphereGeometry args={[0.11, 16, 12]} />
        <meshStandardMaterial color="#5f8a62" roughness={0.85} />
      </mesh>
      <mesh position={[0.05, 0.28, 0.03]} castShadow>
        <sphereGeometry args={[0.07, 12, 10]} />
        <meshStandardMaterial color="#7aa56f" roughness={0.85} />
      </mesh>
    </group>
  );
}
