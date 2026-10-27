import { Icon } from "@/components/Icon";
import { STATUS_VISUALS } from "@/spatial/status-visuals";
import type { SpatialObject } from "@/spatial/types";
import { StatusDot } from "./RhMapPanel";

/** 2D floor plan used on small screens, without WebGL, or if the 3D scene fails. */
export function RhMapFloorPlan({
  objects,
  selectedId,
  onSelect,
}: {
  objects: SpatialObject[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Planta das equipes">
      {objects.map((o) => {
        const selected = o.id === selectedId;
        const visual = STATUS_VISUALS[o.status];
        return (
          <li key={o.id}>
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(selected ? null : o.id)}
              className={`flex h-full min-h-24 w-full flex-col justify-between gap-3 rounded-2xl p-3 text-left shadow-[0_2px_10px_rgba(74,106,138,0.10)] transition-transform duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a6a8a] ${
                selected ? "-translate-y-0.5 ring-2 ring-[#4a6a8a]/50" : ""
              }`}
              style={{ backgroundColor: visual.base }}
            >
              <span className="flex items-start justify-between gap-2">
                <span className="font-display text-sm font-semibold leading-tight text-[var(--clay-title)]">
                  {o.label}
                </span>
                {o.alertCount > 0 && (
                  <Icon name="warning" filled className="shrink-0 text-base text-[#b5543a]" />
                )}
              </span>
              <span className="flex items-center justify-between gap-2 text-[11px] text-[var(--clay-text)]/80">
                <span className="flex items-center gap-1.5">
                  <StatusDot status={o.status} />
                  {visual.label}
                </span>
                <span className="flex items-center gap-0.5" aria-label={`${o.occupancy} pessoas`}>
                  {Array.from({ length: Math.min(o.occupancy, 8) }, (_, i) => (
                    <span
                      key={i}
                      className="inline-block h-2 w-2 rounded-full bg-[var(--clay-title)]/40"
                    />
                  ))}
                  {o.occupancy > 8 ? (
                    <span className="pl-0.5 text-[10px] font-semibold">+{o.occupancy - 8}</span>
                  ) : null}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
