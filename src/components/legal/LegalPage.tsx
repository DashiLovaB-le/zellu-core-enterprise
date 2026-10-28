import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const RELATED = [
  { to: "/privacidade" as const, label: "Privacidade" },
  { to: "/termos" as const, label: "Termos de Uso" },
  { to: "/governanca" as const, label: "Política de Governança" },
  { to: "/dpa" as const, label: "DPA" },
];

export function LegalPage({
  title,
  versionNote,
  lead,
  children,
}: {
  title: string;
  versionNote: string;
  lead?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10 text-sm text-[var(--clay-text)]">
      <p className="text-xs">
        <Link to="/" className="underline">
          Voltar ao início
        </Link>
        {" · "}
        <Link to="/login" className="underline">
          Login
        </Link>
      </p>
      <h1 className="mt-4 font-display text-2xl text-[var(--clay-title)]">{title}</h1>
      <p className="mt-2 text-xs text-[var(--clay-title)]/60">{versionNote}</p>
      {lead ? (
        <div className="mt-4 rounded-xl bg-white/70 p-3 text-xs font-medium text-[var(--clay-title)]">
          {lead}
        </div>
      ) : null}
      {children}
      <nav
        className="mt-10 border-t border-[var(--clay-title)]/10 pt-4 text-xs"
        aria-label="Documentos relacionados"
      >
        <p className="font-semibold text-[var(--clay-title)]">Documentos relacionados</p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {RELATED.map((doc) => (
            <li key={doc.to}>
              <Link to={doc.to} className="underline">
                {doc.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mt-6 font-display text-lg text-[var(--clay-title)]">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
