export type SpatialStatus = "stable" | "monitor" | "attention" | "protected";

export type Vec3 = [number, number, number];

export interface SpatialOccupant {
  id: string;
  memberId: string | null;
  name: string;
  jobTitle: string | null;
  email: string | null;
}

export interface SpatialObject {
  id: string;
  type: "room";
  label: string;
  status: SpatialStatus;
  position: Vec3;
  /** Footprint in world units: [width, depth]. */
  size: [number, number];
  entityId: string;
  alertCount: number;
  occupancy: number;
  occupants: SpatialOccupant[];
}

export type SpatialSupport =
  | { mode: "pending" }
  | { mode: "3d" }
  | { mode: "2d"; reason: "viewport" | "webgl" };
