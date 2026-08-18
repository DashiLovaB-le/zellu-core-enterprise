import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { PRIVACY_CONTACTS, PRIVACY_OPERATORS, PRIVACY_SUMMARY } from "@/lib/privacy";

export type PrivacyConsentValues = {
  adultConfirmed: boolean;
  aiOptIn: boolean;
  rhOptIn: boolean;
  emailOptIn: boolean;
};

export function PrivacyConsentCard({
  onAccept,
  loading,
}: {
  onAccept: (values: PrivacyConsentValues) => void;
  loading?: boolean;
}) {
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [essential, setEssential] = useState(false);
  const [aiOptIn, setAiOptIn] = useState(false);
  const [rhOptIn, setRhOptIn] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(false);
  const canSubmit = adultConfirmed && essential && !loading;

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white/80 p-5 shadow-sm">
      <h2 className="font-display text-lg text-[var(--clay-title)]">{PRIVACY_SUMMARY.title}</h2>
      <p className="mt-2 text-xs text-[var(--clay-text)]/80">{PRIVACY_CONTACTS.controllerNote}</p>
      <div className="mt-4 space-y-3 text-xs text-[var(--clay-text)]/80">
        <div>
          <p className="font-semibold">O que coletamos</p>
          <ul className="mt-1 list-disc pl-4">
            {PRIVACY_SUMMARY.collected.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold">O que o RH vê (só se você autorizar)</p>
          <ul className="mt-1 list-disc pl-4">
            {PRIVACY_SUMMARY.rhSees.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold">O que o RH nunca vê</p>
          <ul className="mt-1 list-disc pl-4">
            {PRIVACY_SUMMARY.rhNeverSees.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold">Operadores e transferência internacional</p>
          <ul className="mt-1 list-disc pl-4">
            {PRIVACY_OPERATORS.map((op) => (
              <li key={op.name}>
                {op.name}: {op.purpose} ({op.location})
              </li>
            ))}
          </ul>
        </div>
      </div>

      <fieldset className="mt-4 space-y-2 text-xs text-[var(--clay-text)]">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={adultConfirmed}
            onChange={(e) => setAdultConfirmed(e.target.checked)}
          />
          <span>Confirmo que tenho 18 anos ou mais.</span>
        </label>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={essential}
            onChange={(e) => setEssential(e.target.checked)}
          />
          <span>
            Li a{" "}
            <Link to="/privacidade" className="underline">
              política de privacidade
            </Link>{" "}
            e autorizo o tratamento essencial do companion (check-in, hábitos, diário). Posso
            revogar no Perfil.
          </span>
        </label>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={aiOptIn}
            onChange={(e) => setAiOptIn(e.target.checked)}
          />
          <span>
            Autorizo envio de contexto de bem-estar a modelos de IA fora do Brasil (OpenRouter).
            Sem isto, o companion usa só respostas locais.
          </span>
        </label>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={rhOptIn}
            onChange={(e) => setRhOptIn(e.target.checked)}
          />
          <span>
            Autorizo o RH a ver indicadores agregados e anônimos da minha equipe (nunca meu humor
            individual).
          </span>
        </label>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={emailOptIn}
            onChange={(e) => setEmailOptIn(e.target.checked)}
          />
          <span>Autorizo e-mails de lembrete de check-in.</span>
        </label>
      </fieldset>

      <p className="mt-3 text-[10px] text-[var(--clay-title)]/50">
        Encarregado: {PRIVACY_CONTACTS.dpoEmail}. Incidentes: {PRIVACY_CONTACTS.incidentEmail}.
      </p>

      <button
        type="button"
        onClick={() =>
          onAccept({ adultConfirmed: true, aiOptIn, rhOptIn, emailOptIn })
        }
        disabled={!canSubmit}
        className="mt-4 w-full rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] py-2.5 text-sm font-bold text-[oklch(0.25_0.04_254)] disabled:opacity-50"
      >
        {loading ? "Salvando..." : "Salvar minhas escolhas"}
      </button>
    </div>
  );
}
