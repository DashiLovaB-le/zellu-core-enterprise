import type { ManagerDirectoryMember, ManagerTeamRoster, RhAlert, RhTeamMetrics } from "@/lib/api/manager.server";
import { MAX_VISIBLE_OCCUPANTS, workstations } from "@/spatial/clay/occupant-slots";
import type { SpatialObject, SpatialOccupant, SpatialStatus } from "@/spatial/types";

const CELL = 6.4;
const MIN_SIDE = 3.4;
const MAX_SIDE = 5.4;

export function roomSide(memberCount: number): number {
  const side = MIN_SIDE + Math.sqrt(Math.max(0, memberCount)) * 0.36;
  return Math.min(MAX_SIDE, Math.max(MIN_SIDE, Number(side.toFixed(2))));
}

export function teamStatusToSpatial(team: RhTeamMetrics): SpatialStatus {
  return team.metricsHidden ? "protected" : team.status;
}

function slug(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "equipe"
  );
}

function occupantName(member: ManagerDirectoryMember): string {
  const name = member.display_name?.trim();
  if (name) return name;
  const email = member.email?.trim();
  if (email) return email.split("@")[0] ?? "Colaborador";
  return "Colaborador";
}

export function occupantsForTeam(
  team: RhTeamMetrics,
  roster: ManagerTeamRoster | null | undefined,
): SpatialOccupant[] {
  const rosterTeam = roster?.teams.find((item) => item.name === team.name);
  const members =
    roster && rosterTeam
      ? roster.members.filter((member) => member.team_id === rosterTeam.id && member.is_active)
      : [];

  if (members.length > 0) {
    return members.slice(0, MAX_VISIBLE_OCCUPANTS).map((member) => ({
      id: member.id,
      memberId: member.id,
      name: occupantName(member),
      jobTitle: member.job_title,
      email: member.email,
    }));
  }

  const placeholders = Math.min(Math.max(0, team.memberCount), MAX_VISIBLE_OCCUPANTS);
  return Array.from({ length: placeholders }, (_, index) => ({
    id: `${slug(team.name)}-colaborador-${index + 1}`,
    memberId: null,
    name: "Colaborador",
    jobTitle: null,
    email: null,
  }));
}

/** Lays teams out as rooms on a centered grid. Rooms only ever represent teams. */
export function teamsToObjects(
  teams: RhTeamMetrics[],
  alerts: RhAlert[],
  roster?: ManagerTeamRoster | null,
): SpatialObject[] {
  const cols = Math.max(1, Math.ceil(Math.sqrt(teams.length)));
  const rows = Math.max(1, Math.ceil(teams.length / cols));

  return teams.map((team, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const occupants = occupantsForTeam(team, roster);
    const side = roomSide(Math.max(team.memberCount, occupants.length));
    const status = teamStatusToSpatial(team);
    return {
      id: `team-${index}-${slug(team.name)}`,
      type: "room",
      label: team.name,
      status,
      position: [(col - (cols - 1) / 2) * CELL, 0, (row - (rows - 1) / 2) * CELL],
      size: [side, side],
      entityId: team.name,
      alertCount: status === "protected" ? 0 : alerts.filter((a) => a.team === team.name).length,
      occupancy: team.memberCount,
      occupants,
    };
  });
}

/** Radius of the smallest circle (XZ plane) around the origin that contains every room. */
export function sceneRadius(objects: SpatialObject[]): number {
  let radius = 0;
  for (const o of objects) {
    const reach = Math.hypot(o.position[0], o.position[2]) + Math.max(...o.size) / 2;
    radius = Math.max(radius, reach);
  }
  return radius;
}

export function findOccupant(objects: SpatialObject[], occupantId: string | null) {
  if (!occupantId) return null;
  for (const object of objects) {
    const occupant = object.occupants.find((item) => item.id === occupantId);
    if (occupant) return { object, occupant };
  }
  return null;
}

export function occupantWorldPosition(
  object: SpatialObject,
  occupantId: string,
): [number, number, number] | null {
  const index = object.occupants.findIndex((item) => item.id === occupantId);
  if (index < 0) return null;
  const stations = workstations(object.occupants.length, object.size[0], object.size[1]);
  const station = stations[index];
  if (!station) return null;
  return [object.position[0] + station.person[0], 0.52, object.position[2] + station.person[1]];
}
