import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { BRANDING } from "@/lib/branding";
import { LEGAL_DOCS_VERSION } from "@/lib/legal";
import { PRIVACY_CONTACTS, PRIVACY_OPERATORS } from "@/lib/privacy";

export const Route = createFileRoute("/governanca")({
  head: () => ({
    meta: [
      { title: `Política de Governança — ${BRANDING.shortName}` },
      {
        name: "description",
        content: `Política de governança de dados e segurança do ${BRANDING.shortName}.`,
      },
    ],
  }),
  component: GovernancaPage,
});

function GovernancaPage() {
  return (
    <LegalPage
      title="Política de Governança"
      versionNote={`Versão ${LEGAL_DOCS_VERSION} · dados, segurança e papéis`}
    >
      <LegalSection title="Objetivo">
        <p>
          Esta política descreve como o {BRANDING.appName} organiza papéis, controles e práticas de
          segurança e privacidade no tratamento de dados pessoais no contexto B2B.
        </p>
      </LegalSection>

      <LegalSection title="Papéis">
        <ul className="list-disc pl-5">
          <li>
            <strong>Controladora:</strong> a empresa que contratou o acesso — define as finalidades do
            tratamento dos dados dos colaboradores.
          </li>
          <li>
            <strong>Operadora:</strong> {PRIVACY_CONTACTS.operatorName} — processa dados sob instrução
            da controladora, conforme o DPA e a Política de Privacidade.
          </li>
          <li>
            <strong>Encarregado (contato):</strong>{" "}
            <a className="underline" href={`mailto:${PRIVACY_CONTACTS.dpoEmail}`}>
              {PRIVACY_CONTACTS.dpoEmail}
            </a>
            .
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Princípios">
        <ul className="list-disc pl-5">
          <li>Minimização: coletamos o necessário para o companion e o painel agregado.</li>
          <li>
            Separação de contextos: diário, chat e sinais individuais não alimentam o painel do RH de
            forma identificável.
          </li>
          <li>
            k-anonimato: indicadores de equipe só aparecem com pelo menos 5 pessoas que autorizaram.
          </li>
          <li>Consentimento granular: IA, RH e e-mail só com opt-in do colaborador.</li>
          <li>Isolamento por empresa: dados de um cliente não são compartilhados com outro.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Segurança">
        <ul className="list-disc pl-5">
          <li>Acesso autenticado e segregação de perfis (colaborador, RH/gestão, administração).</li>
          <li>Políticas de acesso no banco (RLS) e operações privilegiadas controladas.</li>
          <li>Retenção limitada e exclusão automática conforme a Política de Privacidade.</li>
          <li>
            Canal de incidentes:{" "}
            <a className="underline" href={`mailto:${PRIVACY_CONTACTS.incidentEmail}`}>
              {PRIVACY_CONTACTS.incidentEmail}
            </a>
            .
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Operadores e subprocessadores">
        <p>Principais operadores técnicos usados na operação da plataforma:</p>
        <ul className="list-disc pl-5">
          {PRIVACY_OPERATORS.map((op) => (
            <li key={op.name}>
              <strong>{op.name}</strong> — {op.purpose}. Local: {op.location}.
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title="Governança contínua">
        <p>
          Revisamos esta política quando mudam finalidades, operadores relevantes ou exigências legais.
          A versão vigente permanece publicada nesta página. Detalhes operacionais de processamento
          constam no{" "}
          <Link to="/dpa" className="underline">
            DPA
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
