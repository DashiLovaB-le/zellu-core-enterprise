import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import {
  PRIVACY_CONTACTS,
  PRIVACY_OPERATORS,
  PRIVACY_RIGHTS,
  PRIVACY_SUMMARY,
  PRIVACY_AI_PROCESSING,
  RETENTION_DAYS,
  PRIVACY_CONSENT_VERSION,
  CLINICAL_DISCLAIMER,
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
    <LegalPage
      title="Política de privacidade"
      versionNote={`Versão ${PRIVACY_CONSENT_VERSION} · Lei 13.709/2018 (LGPD)`}
      lead={CLINICAL_DISCLAIMER}
    >
      <LegalSection title="Quem trata os dados">
        <p>{PRIVACY_CONTACTS.controllerNote}</p>
        <p>
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
      </LegalSection>

      <LegalSection title="Finalidades">
        <ul className="list-disc pl-5">
          <li>Companion de bem-estar: check-in, hábitos, diário e plano de cuidado.</li>
          <li>IA generativa só com opt-in (OpenRouter, transferência internacional).</li>
          <li>Painel de RH só com opt-in, em agregados com k-anonimato (mínimo 5 pessoas).</li>
          <li>Lembretes por e-mail só com opt-in.</li>
        </ul>
      </LegalSection>

      <LegalSection title="O que coletamos">
        <ul className="list-disc pl-5">
          {PRIVACY_SUMMARY.collected.map((item) => (
            <li key={item}>{item}</li>
          ))}
          <li>Nome, e-mail e vínculo com empresa/equipe para o acesso B2B.</li>
        </ul>
      </LegalSection>

      <LegalSection title="O que o RH não vê">
        <ul className="list-disc pl-5">
          {PRIVACY_SUMMARY.rhNeverSees.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title="Como a IA trata seus dados">
        <p>{PRIVACY_AI_PROCESSING.routing}</p>
        <p>{PRIVACY_AI_PROCESSING.localFallback}</p>
        <p>{PRIVACY_AI_PROCESSING.transfer}</p>
        <p className="font-semibold">O que pode ser enviado (só com opt-in)</p>
        <ul className="list-disc pl-5">
          {PRIVACY_AI_PROCESSING.sent.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="font-semibold">O que nunca é enviado à IA</p>
        <ul className="list-disc pl-5">
          {PRIVACY_AI_PROCESSING.neverSent.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>{PRIVACY_AI_PROCESSING.ourRetention}</p>
      </LegalSection>

      <LegalSection title="Operadores">
        <ul className="list-disc pl-5">
          {PRIVACY_OPERATORS.map((op) => (
            <li key={op.name}>
              <strong>{op.name}</strong> — {op.purpose}. Local: {op.location}.
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title="Retenção">
        <p>
          Chat e diário: {RETENTION_DAYS.chat} dias. Check-ins numéricos: {RETENTION_DAYS.checkins}{" "}
          dias. Logs de sistema (sem conteúdo de saúde): {RETENTION_DAYS.logs} dias. A exclusão roda
          automaticamente todo dia (e também junto ao job de lembretes). Você pode excluir a conta a
          qualquer momento no Perfil.
        </p>
      </LegalSection>

      <LegalSection title="Seus direitos">
        <ul className="list-disc pl-5">
          {PRIVACY_RIGHTS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title="Incidentes">
        <p>
          Se houver incidente relevante (acesso indevido, vazamento ou perda), a operadora comunica o
          encarregado, a controladora (sua empresa) e, quando exigido pelo art. 48, a ANPD e os
          titulares, pelo canal {PRIVACY_CONTACTS.incidentEmail}.
        </p>
      </LegalSection>

      <LegalSection title="Menores">
        <p>
          O companion é destinado a pessoas com 18 anos ou mais. Não cadastre menores de idade.
        </p>
      </LegalSection>

      <LegalSection title="Documentos complementares">
        <p>
          Para condições de uso, governança e processamento em nome da empresa, veja também os{" "}
          <Link to="/termos" className="underline">
            Termos de Uso
          </Link>
          , a{" "}
          <Link to="/governanca" className="underline">
            Política de Governança
          </Link>{" "}
          e o{" "}
          <Link to="/dpa" className="underline">
            DPA
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
