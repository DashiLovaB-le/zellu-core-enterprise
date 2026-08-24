import type { WellnessStatus } from "@/lib/rh-member-summary";
import { statusLabelPt } from "@/lib/rh-member-summary";

const COLORS: Record<WellnessStatus, string> = {
  stable: "bg-[var(--clay-joy)]/40 text-green-800",
  monitor: "bg-[var(--clay-stress)]/40 text-yellow-800",
  attention: "bg-[var(--clay-anxiety)]/40 text-orange-800",
  unknown: "bg-slate-100 text-slate-500",
};

export function WellnessStatusBadge({
  status,
  available,
}: {
  status: WellnessStatus;
  available?: boolean;
}) {
  const resolved: WellnessStatus = available === false ? "unknown" : status;
  return (
    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${COLORS[resolved]}`}>
      {available === false ? "Sem opt-in" : statusLabelPt(resolved)}
    </span>
  );
}
