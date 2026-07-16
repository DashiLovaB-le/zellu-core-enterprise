export function Icon({
  name,
  filled = false,
  className = "",
}: {
  name: string;
  filled?: boolean;
  className?: string;
}) {
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
