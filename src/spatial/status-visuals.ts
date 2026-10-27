import type { SpatialStatus } from "./types";

export interface StatusVisual {
  label: string;
  /** Platform color (clay palette, sRGB hex for three.js). */
  base: string;
  /** Lamp / accent color. */
  accent: string;
  /** Pulse period in seconds; 0 means still. */
  pulse: number;
}

export const STATUS_VISUALS: Record<SpatialStatus, StatusVisual> = {
  stable: { label: "Estável", base: "#d9ead9", accent: "#8fc4a0", pulse: 0 },
  monitor: { label: "Monitorar", base: "#f6e7bd", accent: "#e8b85a", pulse: 3.2 },
  attention: { label: "Atenção", base: "#f5d6c1", accent: "#e07a5f", pulse: 1.8 },
  protected: { label: "Dados protegidos", base: "#dcdde3", accent: "#b9bcc8", pulse: 0 },
};

export const STATUS_ORDER: SpatialStatus[] = ["stable", "monitor", "attention", "protected"];
