import { SOFT_NAV_ICONS } from "@/components/icons/soft-nav-icons";

/**
 * Soft clay SVGs for navigation names; other names keep Material Symbols.
 * Color inherits from parent (`currentColor`) — use `text-[var(--icon-stroke)]` in nav.
 */
export function Icon({
  name,
  filled = false,
  className = "",
}: {
  name: string;
  filled?: boolean;
  className?: string;
}) {
  const SoftIcon = SOFT_NAV_ICONS[name];

  if (SoftIcon) {
    return (
      <span
        className={`inline-flex shrink-0 select-none items-center justify-center leading-none ${className}`}
        style={{
          fontSize: "1.1em",
          width: "1.25em",
          height: "1.25em",
        }}
        aria-hidden
      >
        <SoftIcon filled={filled} className="block size-[1em]" />
      </span>
    );
  }

  return (
    <span
      className={`material-symbols-outlined inline-flex shrink-0 select-none items-center justify-center leading-none ${className}`}
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 500`,
        fontSize: "1.1em",
        width: "1.25em",
        height: "1.25em",
        overflow: "hidden",
      }}
      aria-hidden
    >
      {name}
    </span>
  );
}
