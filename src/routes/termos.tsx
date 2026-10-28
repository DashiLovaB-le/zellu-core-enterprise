import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { BRANDING } from "@/lib/branding";
import { LEGAL_DOCS_VERSION } from "@/lib/legal";
import { CLINICAL_DISCLAIMER, PRIVACY_CONTACTS } from "@/lib/privacy";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: `Termos de Uso — ${BRANDING.shortName}` },
      {
        name: "description",
        content: `Termos de uso da plataforma ${BRANDING.shortName}.`,
      },
    ],
  }),
  component: TermosPage,
});

function TermosPage() {
  return (
    <LegalPage
      title="Termos de Uso"
      versionNote={`Versão ${LEGAL_DOCS_VERSION} · ${BRANDING.appName}`}
      lead={CLINICAL_DISCLAIMER}
    >
      <LegalSection title="Aceite">
        <p>
          Ao acessar ou usar o {BRANDING.appName}, você concorda com estes Termos e com a{" "}
          <Link to="/privacidade" className="underline">
            Política de Privacidade
          </Link>
          . Se não concordar, não utilize a plataforma.
        </p>
      </LegalSection>

      <LegalSection title="O serviço">
        <p>
          O {BRANDING.appName} é um companion digital de bem-estar emocional para empresas: check-ins,
          hábitos, diário, conversa com companion, pausas de cuidado e painel agregado para RH. Não é
          atendimento clínico, diagnóstico nem substituição de profissional de saúde.
        </p>
      </LegalSection>

      <LegalSection title="Contas e acesso">
        <ul className="list-disc pl-5">
          <li>O acesso é concedido pela empresa contratante, em geral via convite por e-mail corporativo.</li>
          <li>Você é responsável por manter a confidencialidade das suas credenciais.</li>
          <li>Informações cadastrais devem ser verdadeiras e atualizadas.</li>
          <li>O uso é destinado a pessoas com 18 anos ou mais.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Uso aceitável">
        <p>É proibido, entre outras condutas:</p>
        <ul className="list-disc pl-5">
          <li>Usar a plataforma para fins ilícitos ou que violem direitos de terceiros.</li>
          <li>Tentar acessar dados de outras pessoas, empresas ou áreas sem autorização.</li>
          <li>Interferir na segurança, disponibilidade ou integridade do serviço.</li>
          <li>Automatizar scrapers ou engenharia reversa além do permitido por lei.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Conteúdo do usuário">
        <p>
          Textos de diário, chat e demais registros que você cria permanecem sob o regime descrito na
          Política de Privacidade. A empresa contratante é controladora dos dados dos colaboradores; a{" "}
          {PRIVACY_CONTACTS.operatorName} opera a plataforma conforme instruções e o DPA aplicável.
        </p>
      </LegalSection>

      <LegalSection title="Disponibilidade e alterações">
        <p>
          Podemos atualizar, suspender ou descontinuar funcionalidades com aviso razoável quando
          possível. Estes Termos podem ser revisados; a versão vigente fica nesta página, com o número
          de versão indicado acima.
        </p>
      </LegalSection>

      <LegalSection title="Limitação">
        <p>
          Na medida permitida pela lei brasileira, o {BRANDING.appName} é oferecido “como está”, sem
          garantia de resultados de saúde ou continuidade ininterrupta. Nada nestes Termos limita
          direitos do consumidor ou do titular previstos em lei.
        </p>
      </LegalSection>

      <LegalSection title="Contato">
        <p>
          Dúvidas:{" "}
          <a className="underline" href={`mailto:${PRIVACY_CONTACTS.dpoEmail}`}>
            {PRIVACY_CONTACTS.dpoEmail}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
