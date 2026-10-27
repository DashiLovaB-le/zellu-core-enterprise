import { describe, expect, it } from "vitest";
import { hash32, MAX_VISIBLE_OCCUPANTS, occupantSlots, workstations } from "./occupant-slots";

describe("occupantSlots", () => {
  it("não desenha ninguém em sala vazia", () => {
    expect(occupantSlots(0, 3, 3)).toEqual([]);
  });

  it("limita o número visível e cabe na sala", () => {
    const slots = occupantSlots(80, 4.2, 4.2);
    expect(slots).toHaveLength(MAX_VISIBLE_OCCUPANTS);
    for (const [x, z] of slots) {
      expect(Math.abs(x)).toBeLessThan(2.2);
      expect(Math.abs(z)).toBeLessThan(2.2);
    }
  });

  it("coloca um único ocupante à frente da mesa", () => {
    const [person] = occupantSlots(1, 3.4, 3.4);
    const [station] = workstations(1, 3.4, 3.4);
    expect(person[1]).toBeGreaterThan(station.desk[1]);
  });
});

describe("workstations", () => {
  it("cria uma mesa e uma cadeira por colaborador visível", () => {
    const stations = workstations(4, 4, 4);
    expect(stations).toHaveLength(4);
    expect(new Set(stations.map((s) => s.desk[0])).size).toBeGreaterThan(1);
  });
});

describe("hash32", () => {
  it("é estável e varia com a semente", () => {
    expect(hash32("team-a-0")).toBe(hash32("team-a-0"));
    expect(hash32("team-a-0")).not.toBe(hash32("team-a-1"));
  });
});
