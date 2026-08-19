import { useEffect, useState } from "react";
import { CVV_LABEL, CVV_PHONE } from "@/lib/crisis";
import { CLINICAL_DISCLAIMER } from "@/lib/privacy";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

const CHAT_DISCLAIMER_CACHE_KEY = "mmc_chat_disclaimer_dismissed_at";
const CHAT_DISCLAIMER_TTL_MS = 24 * 60 * 60 * 1000;

function shouldShowChatDisclaimer(): boolean {
  try {
    const raw = localStorage.getItem(CHAT_DISCLAIMER_CACHE_KEY);
    if (!raw) return true;
    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) return true;
    return Date.now() - dismissedAt >= CHAT_DISCLAIMER_TTL_MS;
  } catch {
    return true;
  }
}

function dismissChatDisclaimer() {
  try {
    localStorage.setItem(CHAT_DISCLAIMER_CACHE_KEY, String(Date.now()));
  } catch {
    // ignore quota / private mode
  }
}

function CrisisHelpCopy({ companyChannel }: { companyChannel?: string | null }) {
  return (
    <>
      <p className="text-xs leading-relaxed text-[var(--clay-text)]/80">{CLINICAL_DISCLAIMER}</p>
      <p className="mt-2 text-xs leading-relaxed text-[var(--clay-text)]/80">
        Em crise, ligue para o <strong>{CVV_LABEL}</strong> no <strong>{CVV_PHONE}</strong> (24h,
        gratuito) ou <strong>SAMU 192</strong>.
      </p>
      {companyChannel ? (
        <p className="mt-2 text-xs text-[var(--clay-text)]/70">Canal da empresa: {companyChannel}</p>
      ) : null}
    </>
  );
}

export function CrisisHelp({ companyChannel }: { companyChannel?: string | null }) {
  return (
    <section className="rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
      <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
        Precisa de ajuda agora?
      </h3>
      <CrisisHelpCopy companyChannel={companyChannel} />
    </section>
  );
}

export function CrisisHelpChatModal({ companyChannel }: { companyChannel?: string | null }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (shouldShowChatDisclaimer()) setOpen(true);
  }, []);

  const close = () => {
    dismissChatDisclaimer();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <DialogContent className="max-w-sm rounded-2xl border-border/40 bg-[var(--clay-cream)] p-5 shadow-lg sm:rounded-2xl">
        <DialogTitle className="text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
          Precisa de ajuda agora?
        </DialogTitle>
        <DialogDescription asChild>
          <div>
            <CrisisHelpCopy companyChannel={companyChannel} />
          </div>
        </DialogDescription>
        <button
          type="button"
          onClick={close}
          className="mt-2 w-full rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] px-4 py-2.5 text-sm font-semibold text-[var(--clay-title)] shadow-sm active:translate-y-px"
        >
          Fechar
        </button>
      </DialogContent>
    </Dialog>
  );
}
