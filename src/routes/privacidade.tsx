import { createFileRoute, Link } from "@tanstack/react-router";
import {
  PRIVACY_CONTACTS,
  PRIVACY_OPERATORS,
  PRIVACY_RIGHTS,
  PRIVACY_SUMMARY,
  RETENTION_DAYS,
  PRIVACY_CONSENT_VERSION,
} from "@/lib/privacy";
import { BRANDING } from "@/lib/branding";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: `Privacidade — ${BRANDING.shortName}` },
      {
        name: "description",
        content: "Política de privacidade e direitos do titular (LGPD).",
      },
    ],
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10 text-sm text-[var(--clay-text)]">
      <p className="text-xs">
        <Link to="/login" className="underline">
          Voltar ao login
        </Link>
      </p>
      <h1 className="mt-4 font-display text-2xl text-[var(--clay-title)]">Política de privacidade</h1>
      <p className="mt-2 text-xs text-[var(--clay-title)]/60">
        Versão {PRIVACY_CONSENT_VERSION} · Lei 13.709/2018 (LGPD)
      </p>

      <h2 className="mt-6 font-display text-lg text-[var(--clay-title)]">Quem trata os dados</h2>
      <p className="mt-2">{PRIVACY_CONTACTS.controllerNote}</p>
      <p className="mt-2">
        Operadora: {PRIVACY_CONTACTS.operatorName}. Encarregado:{" "}
        <a className="underline" href={`mailto:${PRIVACY_CONTACTS.dpoEmail}`}>
          {PRIVACY_CONTACTS.dpoEmail}
        </a>
        . Incidentes de segurança:{" "}
        <a className="underline" href={`mailto:${PRIVACY_CONTACTS.incidentEmail}`}>
          {PRIVACY_CONTACTS.incidentEmail}
        </a>
        .
      </p>

      <h2 className="mt-6 font-display text-lg text-[var(--clay-title)]">Finalidades</h2>
      <ul className="mt-2 list-disc pl-5">
        <li>Companion de bem-estar: check-in, hábitos, diário e plano de cuidado.</li>
        <li>IA generativa só com opt-in (OpenRouter, transferência internacional).</li>
        <li>Painel de RH só com opt-in, em agregados com k-anonimato (mínimo 5 pessoas).</li>
        <li>Lembretes por e-mail só com opt-in.</li>
      </ul>

      <h2 className="mt-6 font-display text-lg text-[var(--clay-title)]">O que coletamos</h2>
      <ul className="mt-2 list-disc pl-5">
        {PRIVACY_SUMMARY.collected.map((item) => (
          <li key={item}>{item}</li>
        ))}
        <li>Nome, e-mail e vínculo com empresa/equipe para o acesso B2B.</li>
      </ul>

      <h2 className="mt-6 font-display text-lg text-[var(--clay-title)]">O que o RH não vê</h2>
      <ul className="mt-2 list-disc pl-5">
        {PRIVACY_SUMMARY.rhNeverSees.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h2 className="mt-6 font-display text-lg text-[var(--clay-title)]">Operadores</h2>
      <ul className="mt-2 list-disc pl-5">
        {PRIVACY_OPERATORS.map((op) => (
          <li key={op.name}>
            <strong>{op.name}</strong> — {op.purpose}. Local: {op.location}.
          </li>
        ))}
      </ul>

      <h2 className="mt-6 font-display text-lg text-[var(--clay-title)]">Retenção</h2>
      <p className="mt-2">
        Chat e diário: {RETENTION_DAYS.chat} dias. Check-ins numéricos: {RETENTION_DAYS.checkins}{" "}
        dias. Logs de sistema (sem conteúdo de saúde): {RETENTION_DAYS.logs} dias. Depois disso os
        registros são apagados. Você pode excluir a conta a qualquer momento no Perfil.
      </p>

      <h2 className="mt-6 font-display text-lg text-[var(--clay-title)]">Seus direitos</h2>
      <ul className="mt-2 list-disc pl-5">
        {PRIVACY_RIGHTS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h2 className="mt-6 font-display text-lg text-[var(--clay-title)]">Incidentes</h2>
      <p className="mt-2">
        Se houver incidente relevante (acesso indevido, vazamento ou perda), a operadora comunica o
        encarregado, a controladora (sua empresa) e, quando exigido pelo art. 48, a ANPD e os
        titulares, pelo canal {PRIVACY_CONTACTS.incidentEmail}.
      </p>

      <h2 className="mt-6 font-display text-lg text-[var(--clay-title)]">Menores</h2>
      <p className="mt-2">
        O companion é destinado a pessoas com 18 anos ou mais. Não cadastre menores de idade.
      </p>
    </div>
  );
}
