import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { completeOnboarding } from "@/lib/api/invites.server";
import { savePrivacyConsent } from "@/lib/api/privacy.server";
import { PrivacyConsentCard, type PrivacyConsentValues } from "@/components/PrivacyConsentCard";
import { Mascot } from "@/components/Mascot";
import { BRANDING } from "@/lib/branding";
import { DEFAULT_TIMEZONE } from "@/lib/timezone";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [{ title: `Começar — ${BRANDING.shortName}` }],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { session, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"consent" | "profile">("consent");
  const [name, setName] = useState(user?.email?.split("@")[0] ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timezone =
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : DEFAULT_TIMEZONE;
  const token = session;

  useEffect(() => {
    if (!authLoading && (!user || !token)) {
      navigate({ to: "/login", replace: true });
    }
  }, [authLoading, user, token, navigate]);

  if (authLoading || !user || !token) return null;

  const acceptPrivacy = async (values: PrivacyConsentValues) => {
    if (!values.adultConfirmed) {
      setError("É preciso ter 18 anos ou mais para usar o companion.");
      return;
    }
    setSaving(true);
    const result = await savePrivacyConsent({
      data: {
        adultConfirmed: true,
        aiOptIn: values.aiOptIn,
        rhOptIn: values.rhOptIn,
        emailOptIn: values.emailOptIn,
      },
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setStep("profile");
  };

  const finish = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await completeOnboarding({
      data: { displayName: name, timezone },
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    navigate({ to: "/checkin", replace: true });
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-6 py-8">
      {step === "consent" ? (
        <div className="w-full max-w-md">
          <div className="mb-4 flex justify-center">
            <Mascot pose="wave" size="md" />
          </div>
          <PrivacyConsentCard onAccept={acceptPrivacy} loading={saving} />
          {error && <p className="mt-3 text-center text-xs text-red-500">{error}</p>}
        </div>
      ) : (
        <form onSubmit={finish} className="w-full max-w-sm space-y-3 rounded-2xl bg-white/80 p-5 shadow-sm">
          <div className="mb-2 flex justify-center">
            <Mascot pose="encourage" size="md" />
          </div>
          <h1 className="font-display text-lg text-[var(--clay-title)]">Como podemos te chamar?</h1>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl bg-white px-3 py-2.5 text-sm outline-none shadow-sm"
          />
          <p className="text-[10px] text-[var(--clay-title)]/50">Fuso detectado: {timezone}</p>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] py-2.5 text-sm font-bold text-[oklch(0.25_0.04_254)]"
          >
            Ir para o check-in
          </button>
        </form>
      )}
    </div>
  );
}
