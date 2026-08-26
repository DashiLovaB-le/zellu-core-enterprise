import type { ImgHTMLAttributes } from "react";
import {
  getCompanion,
  getVisualCompanion,
  resolveCompanionId,
  type CompanionId,
  type CompanionPose,
  type CompanionSize,
} from "@/lib/companions";
import { getChicoPoseSrc } from "@/lib/companions/chico";

const SIZE_PX: Record<CompanionSize, number> = {
  xs: 44,
  sm: 72,
  md: 108,
  lg: 160,
};

export type CompanionMascotProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  companionId?: CompanionId | string | null;
  pose: CompanionPose;
  size?: CompanionSize;
  alt?: string;
};

function resolvePoseSrc(companionId: CompanionId | string | null | undefined, pose: CompanionPose): string {
  const visual = getVisualCompanion(companionId ?? undefined);
  const fromRegistry = visual.poses[pose];
  if (fromRegistry) return fromRegistry;
  return getChicoPoseSrc(pose);
}

/** Companion com poses — usa fallback visual Chico quando o personagem ainda não tem artes */
export function CompanionMascot({
  companionId,
  pose,
  size = "md",
  className = "",
  alt,
  ...rest
}: CompanionMascotProps) {
  const resolvedId = resolveCompanionId(companionId ?? undefined);
  const companion = getCompanion(resolvedId);
  const px = SIZE_PX[size];
  const label = alt ?? companion.displayName;

  return (
    <img
      src={resolvePoseSrc(companionId, pose)}
      alt={label}
      width={px}
      height={px}
      draggable={false}
      className={`pointer-events-none shrink-0 select-none object-contain transition-opacity duration-200 ${className}`}
      {...rest}
    />
  );
}

export function CompanionMascotEmpty({
  companionId,
  pose = "empty",
  size = "sm",
  title,
  description,
  className = "",
}: {
  companionId?: CompanionId | string | null;
  pose?: CompanionPose;
  size?: CompanionSize;
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-3 px-4 py-6 text-center ${className}`}>
      <CompanionMascot companionId={companionId} pose={pose} size={size} />
      {title ? (
        <p className="font-display text-sm text-[var(--clay-title)]">{title}</p>
      ) : null}
      {description ? (
        <p className="max-w-xs text-xs leading-relaxed text-[var(--clay-text)]/70">{description}</p>
      ) : null}
    </div>
  );
}
