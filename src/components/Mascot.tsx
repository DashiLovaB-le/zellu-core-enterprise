import type { ImgHTMLAttributes } from "react";
import { CompanionMascot, CompanionMascotEmpty } from "@/components/CompanionMascot";
import type { CompanionPose, CompanionSize } from "@/lib/companions";

export type MascotPose = CompanionPose;
export type MascotSize = CompanionSize;

export type MascotProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  pose: MascotPose;
  size?: MascotSize;
  alt?: string;
  companionId?: string | null;
};

/** @deprecated Prefer CompanionMascot — mantém compatibilidade usando Chico */
export function Mascot({ pose, size = "md", className = "", alt = "", companionId = "Chico", ...rest }: MascotProps) {
  return (
    <CompanionMascot
      companionId={companionId}
      pose={pose}
      size={size}
      className={className}
      alt={alt}
      {...rest}
    />
  );
}

export function MascotEmpty({
  pose = "empty",
  size = "sm",
  title,
  description,
  className = "",
  companionId = "Chico",
}: {
  pose?: MascotPose;
  size?: MascotSize;
  title?: string;
  description?: string;
  className?: string;
  companionId?: string | null;
}) {
  return (
    <CompanionMascotEmpty
      companionId={companionId}
      pose={pose}
      size={size}
      title={title}
      description={description}
      className={className}
    />
  );
}
