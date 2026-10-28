import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { BRANDING } from "@/lib/branding";
import { LEGAL_DOCS_VERSION } from "@/lib/legal";
import {
  PRIVACY_AI_PROCESSING,
  PRIVACY_CONTACTS,
  PRIVACY_OPERATORS,
  RETENTION_DAYS,
} from "@/lib/privacy";

export const Route = createFileRoute("/dpa")({
  head: () => ({
    meta: [
      { title: `DPA — ${BRANDING.shortName}` },
      {
        name: "description",
        content: `Acordo de Processamento de Dados (DPA) do ${BRANDING.shortName}.`,
      },
    ],
  }),
  component: DpaPage,
});

function DpaPage() {
  return (
    <LegalPage
      title="Acordo de Processamento de Dados (DPA)"
      versionNote={`Versão ${LEGAL_DOCS_VERSION} · art. 39 da LGPD · modelo público`}
      lead={
        <>
          Este texto descreve o processamento que a operadora realiza em nome da empresa contratante
          (controladora). Em contratos comerciais, cláusulas específicas podem complementar ou
          prevalecer sobre este modelo público.
        </>
      }
    >
      <LegalSection title="Partes">
        <ul className="list-disc pl-5">
          <li>
            <strong>Controladora:</strong> a pessoa jurídica que contrata o {BRANDING.appName} para seus
            colaboradores.
          </li>
          <li>
            <strong>Operadora:</strong> {PRIVACY_CONTACTS.operatorName}.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Objeto">
        <p>
          A operadora trata dados pessoais necessários para prestar o companion de bem-estar e o
          painel agregado de RH, exclusivamente conforme instruções da controladora e a documentação
          pública de privacidade.
        </p>
      </LegalSection>

      <LegalSection title="Categorias de titulares e dados">
        <ul className="list-disc pl-5">
          <li>Colaboradores convidados pela controladora (nome, e-mail, vínculo empresa/equipe).</li>
          <li>
            Dados de bem-estar gerados no uso: check-ins, hábitos, plano de cuidado, diário e chat
            (quando usados).
          </li>
          <li>
            Preferências de consentimento (IA, compartilhamento com RH, lembretes por e-mail).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Finalidades do processamento">
        <ul className="list-disc pl-5">
          <li>Disponibilizar o companion e funcionalidades de autocuidado ao colaborador.</li>
          <li>
            Gerar indicadores agregados e relatórios para RH/gestão, só com opt-in e k-anonimato
            (mínimo 5).
          </li>
          <li>Autenticação, suporte operacional e segurança da plataforma.</li>
          <li>IA generativa somente com opt-in do titular; {PRIVACY_AI_PROCESSING.transfer}</li>
        </ul>
      </LegalSection>

      <LegalSection title="Obrigações da operadora">
        <ul className="list-disc pl-5">
          <li>Tratar dados só para as finalidades acima, salvo obrigação legal.</li>
          <li>Aplicar medidas técnicas e organizacionais adequadas de segurança.</li>
          <li>Garantir que pessoas autorizadas estejam sob compromisso de confidencialidade.</li>
          <li>
            Auxiliar a controladora, na medida do razoável, no atendimento a direitos dos titulares e
            comunicações à ANPD.
          </li>
          <li>
            Comunicar incidentes relevantes pelo canal{" "}
            <a className="underline" href={`mailto:${PRIVACY_CONTACTS.incidentEmail}`}>
              {PRIVACY_CONTACTS.incidentEmail}
            </a>
            .
          </li>
          <li>
            Ao término do contrato, devolver ou eliminar dados pessoais conforme instrução e retenções
            legais, ressalvados backups residuais até a rotação normal.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Obrigações da controladora">
        <ul className="list-disc pl-5">
          <li>Garantir base legal e transparência perante os colaboradores.</li>
          <li>Configurar convites, equipes e acessos de gestão de forma correta.</li>
          <li>Não solicitar à operadora tratamentos incompatíveis com a Política de Privacidade.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Suboperadores">
        <p>A operadora pode recorrer a subprocessadores técnicos, incluindo:</p>
        <ul className="list-disc pl-5">
          {PRIVACY_OPERATORS.map((op) => (
            <li key={op.name}>
              <strong>{op.name}</strong> — {op.purpose}. Local: {op.location}.
            </li>
          ))}
        </ul>
        <p>
          Mudanças materiais de subprocessadores relevantes serão refletidas na documentação pública
          quando aplicável.
        </p>
      </LegalSection>

      <LegalSection title="Retenção">
        <p>
          Chat e diário: {RETENTION_DAYS.chat} dias. Check-ins numéricos: {RETENTION_DAYS.checkins}{" "}
          dias. Logs de sistema (sem conteúdo de saúde): {RETENTION_DAYS.logs} dias. O titular pode
          excluir a conta no Perfil.
        </p>
      </LegalSection>

      <LegalSection title="Transferências internacionais">
        <p>{PRIVACY_AI_PROCESSING.transfer}</p>
        <p>
          Infraestrutura de autenticação, banco e e-mail pode residir fora do Brasil, conforme
          descrito na Política de Privacidade e na lista de operadores.
        </p>
      </LegalSection>

      <LegalSection title="Contato">
        <p>
          Encarregado / privacidade:{" "}
          <a className="underline" href={`mailto:${PRIVACY_CONTACTS.dpoEmail}`}>
            {PRIVACY_CONTACTS.dpoEmail}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
