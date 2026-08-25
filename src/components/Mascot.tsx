import type { ImgHTMLAttributes } from "react";
import waveImg from "@/assets/mascote/transparent/wave-lg.png";
import idleCalmImg from "@/assets/mascote/transparent/idlecalm-md.png";
import listenImg from "@/assets/mascote/transparent/listen-sm.png";
import cheerImg from "@/assets/mascote/transparent/cheer-md.png";
import encourageImg from "@/assets/mascote/transparent/encourage-md.png";
import breatheImg from "@/assets/mascote/transparent/breathe-lg.png";
import emptyImg from "@/assets/mascote/transparent/empty-sm.png";
import thinkImg from "@/assets/mascote/transparent/think-sm.png";

export type MascotPose =
  | "wave"
  | "idle-calm"
  | "listen"
  | "cheer"
  | "encourage"
  | "breathe"
  | "empty"
  | "think";

export type MascotSize = "xs" | "sm" | "md" | "lg";

const POSE_SRC: Record<MascotPose, string> = {
  wave: waveImg,
  "idle-calm": idleCalmImg,
  listen: listenImg,
  cheer: cheerImg,
  encourage: encourageImg,
  breathe: breatheImg,
  empty: emptyImg,
  think: thinkImg,
};

const SIZE_PX: Record<MascotSize, number> = {
  xs: 44,
  sm: 72,
  md: 108,
  lg: 160,
};

export type MascotProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  pose: MascotPose;
  size?: MascotSize;
  alt?: string;
};

/** Urso mascote — PNG transparente, escala por token de tamanho. */
export function Mascot({
  pose,
  size = "md",
  className = "",
  alt = "",
  ...rest
}: MascotProps) {
  const px = SIZE_PX[size];
  return (
    <img
      src={POSE_SRC[pose]}
      alt={alt}
      width={px}
      height={px}
      draggable={false}
      className={`pointer-events-none shrink-0 select-none object-contain ${className}`}
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
}: {
  pose?: MascotPose;
  size?: MascotSize;
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-3 px-4 py-6 text-center ${className}`}>
      <Mascot pose={pose} size={size} />
      {title ? (
        <p className="font-display text-sm text-[var(--clay-title)]">{title}</p>
      ) : null}
      {description ? (
        <p className="max-w-xs text-xs leading-relaxed text-[var(--clay-text)]/70">{description}</p>
      ) : null}
    </div>
  );
}
