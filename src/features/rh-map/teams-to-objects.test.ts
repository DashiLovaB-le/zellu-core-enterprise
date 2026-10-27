import { describe, expect, it } from "vitest";
import type { RhAlert, RhTeamMetrics } from "@/lib/api/manager.server";
import { occupantsForTeam, roomSide, sceneRadius, teamsToObjects } from "./teams-to-objects";

function team(partial: Partial<RhTeamMetrics> & { name: string }): RhTeamMetrics {
  return {
    memberCount: 8,
    avgSleep: 7,
    avgMood: 3.5,
    avgWater: 1500,
    negativeMoodPct: 10,
    status: "stable",
    metricsHidden: false,
    ...partial,
  };
}

describe("teamsToObjects", () => {
  it("cria uma sala por equipe, com ids únicos mesmo para nomes repetidos", () => {
    const objects = teamsToObjects([team({ name: "Vendas" }), team({ name: "Vendas" })], []);
    expect(objects).toHaveLength(2);
    expect(new Set(objects.map((o) => o.id)).size).toBe(2);
    expect(objects.every((o) => o.type === "room")).toBe(true);
    expect(objects[0].occupancy).toBe(8);
    expect(objects[0].occupants).toHaveLength(8);
  });

  it("marca equipes com k-anonimato como protegidas e não conta alertas nelas", () => {
    const alerts: RhAlert[] = [
      { id: "a1", team: "Jurídico", type: "stress", severity: "high", message: "x" },
      { id: "a2", team: "Produto", type: "sleep", severity: "medium", message: "y" },
    ];
    const [juridico, produto] = teamsToObjects(
      [
        team({ name: "Jurídico", memberCount: 3, metricsHidden: true, status: "attention" }),
        team({ name: "Produto", status: "monitor" }),
      ],
      alerts,
    );
    expect(juridico.status).toBe("protected");
    expect(juridico.alertCount).toBe(0);
    expect(produto.status).toBe("monitor");
    expect(produto.alertCount).toBe(1);
  });

  it("centraliza a grade na origem", () => {
    const objects = teamsToObjects(
      ["A", "B", "C", "D"].map((name) => team({ name })),
      [],
    );
    const sumX = objects.reduce((s, o) => s + o.position[0], 0);
    const sumZ = objects.reduce((s, o) => s + o.position[2], 0);
    expect(sumX).toBeCloseTo(0);
    expect(sumZ).toBeCloseTo(0);
    expect(sceneRadius(objects)).toBeGreaterThan(0);
  });

  it("liga ocupantes do diretório ao bonequinho da equipe", () => {
    const objects = teamsToObjects(
      [team({ name: "Produto", memberCount: 2 })],
      [],
      {
        teams: [{ id: "t1", name: "Produto", description: null }],
        members: [
          {
            id: "m1",
            email: "ana@acme.com",
            display_name: "Ana Souza",
            role: "companion",
            team_id: "t1",
            is_active: true,
            company_id: "c1",
            job_title: "PM",
            created_at: null,
            avatar_url: null,
          },
          {
            id: "m2",
            email: "bo@acme.com",
            display_name: "Bo Lima",
            role: "companion",
            team_id: "t1",
            is_active: true,
            company_id: "c1",
            job_title: null,
            created_at: null,
            avatar_url: null,
          },
        ],
      },
    );
    expect(objects[0].occupants.map((o) => o.name)).toEqual(["Ana Souza", "Bo Lima"]);
    expect(objects[0].occupants[0].memberId).toBe("m1");
  });
});

describe("occupantsForTeam", () => {
  it("usa placeholders quando o diretório não casa com a equipe", () => {
    const people = occupantsForTeam(team({ name: "Ops", memberCount: 3 }), null);
    expect(people).toHaveLength(3);
    expect(people.every((p) => p.memberId === null)).toBe(true);
  });
});

describe("roomSide", () => {
  it("cresce com o tamanho da equipe dentro de limites", () => {
    expect(roomSide(0)).toBe(3.4);
    expect(roomSide(25)).toBeGreaterThan(roomSide(4));
    expect(roomSide(10_000)).toBe(5.4);
  });
});
