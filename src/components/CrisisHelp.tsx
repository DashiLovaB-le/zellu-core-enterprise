import { CVV_LABEL, CVV_PHONE } from "@/lib/crisis";

export function CrisisHelp({ companyChannel }: { companyChannel?: string | null }) {
  return (
    <section className="rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
      <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
        Precisa de ajuda agora?
      </h3>
      <p className="text-xs leading-relaxed text-[var(--clay-text)]/80">
        Este app não substitui profissionais de saúde. Em crise, ligue para o{" "}
        <strong>{CVV_LABEL}</strong> no <strong>{CVV_PHONE}</strong> (24h, gratuito) ou SAMU 192.
      </p>
      {companyChannel ? (
        <p className="mt-2 text-xs text-[var(--clay-text)]/70">Canal da empresa: {companyChannel}</p>
      ) : null}
    </section>
  );
}
