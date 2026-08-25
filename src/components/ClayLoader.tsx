import { Mascot } from "@/components/Mascot";

type ClayLoaderSize = "sm" | "md" | "lg";

const SIZE_PX: Record<ClayLoaderSize, number> = {
  sm: 16,
  md: 28,
  lg: 40,
};

/**
 * Anel outline macio — loading no estilo clay (gira devagar).
 * Cor via `currentColor` / `text-[var(--icon-stroke)]`.
 */
export function ClayLoader({
  size = "md",
  className = "",
}: {
  size?: ClayLoaderSize;
  className?: string;
}) {
  const px = SIZE_PX[size];

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`animate-clay-spin text-[var(--icon-stroke)] ${className}`}
      role="status"
      aria-label="Carregando"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeOpacity="0.18"
      />
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeDasharray="16 48"
        strokeDashoffset="0"
      />
    </svg>
  );
}

/** Estado de página inteira — mascote pensando + anel clay. */
export function PageLoader({
  className = "",
  withMascot = true,
}: {
  className?: string;
  withMascot?: boolean;
}) {
  return (
    <div
      className={`flex min-h-[100dvh] flex-col items-center justify-center gap-4 ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Carregando"
    >
      {withMascot ? (
        <Mascot pose="think" size="sm" className="opacity-90" />
      ) : null}
      <ClayLoader size="lg" />
    </div>
  );
}
