/** Max clay figures drawn per room. Occupancy above this still counts in the panel. */
export const MAX_VISIBLE_OCCUPANTS = 12;

export type Workstation = {
  person: [number, number];
  desk: [number, number];
  chair: [number, number];
  yaw: number;
};

/** Places standing collaborators in front of desks that face the back wall. */
export function workstations(count: number, width: number, depth: number): Workstation[] {
  const n = Math.min(Math.max(0, Math.floor(count)), MAX_VISIBLE_OCCUPANTS);
  if (n === 0) return [];

  const cols = n <= 3 ? n : n <= 8 ? Math.min(4, Math.ceil(n / 2)) : 4;
  const rows = Math.ceil(n / cols);
  const halfW = Math.max(0.4, width / 2 - 0.38);
  const halfD = Math.max(0.4, depth / 2 - 0.32);
  const deskW = 0.7;
  const gapX = 0.12;
  const rowPitch = Math.min(1.08, Math.max(0.9, (halfD * 2 - 0.55) / Math.max(rows, 1)));
  const backZ = -halfD + 0.18;

  const items: Workstation[] = [];
  for (let i = 0; i < n; i += 1) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const inRow = Math.min(cols, n - row * cols);
    const rowWidth = inRow * deskW + Math.max(0, inRow - 1) * gapX;
    const scale = Math.min(1, (halfW * 2) / Math.max(rowWidth, 0.01));
    const pitch = (deskW + gapX) * scale;
    const startX = -((inRow - 1) * pitch) / 2;
    const x = Math.max(-halfW, Math.min(halfW, startX + col * pitch));
    const deskZ = Math.max(-halfD, Math.min(halfD - 0.62, backZ + row * rowPitch));
    const chairZ = Math.min(halfD - 0.32, deskZ + 0.32);
    const personZ = Math.min(halfD, chairZ + 0.3);
    items.push({
      person: [x, personZ],
      desk: [x, deskZ],
      chair: [x, chairZ],
      yaw: 0.28 + (i % 3) * 0.06,
    });
  }
  return items;
}

export function occupantSlots(
  count: number,
  width: number,
  depth: number,
): Array<[number, number]> {
  return workstations(count, width, depth).map((slot) => slot.person);
}

export function hash32(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
