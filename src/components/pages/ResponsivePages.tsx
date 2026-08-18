import type { ReactNode } from "react";

/** Unifica o switch mobile/desktop repetido nas rotas. */
export function ResponsivePages({
  mobile,
  desktop,
}: {
  mobile: ReactNode;
  desktop: ReactNode;
}) {
  return (
    <>
      <div className="block md:hidden">{mobile}</div>
      <div className="hidden md:block">{desktop}</div>
    </>
  );
}
