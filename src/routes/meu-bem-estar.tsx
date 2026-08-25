import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { MobileBemEstarPage } from "@/components/pages/mobile/BemEstarPage";
import { DesktopBemEstarPage } from "@/components/pages/desktop/BemEstarPage";
import { BRANDING } from "@/lib/branding";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useAuth } from "@/lib/auth-context";
import { ClayLoader } from "@/components/ClayLoader";
import { loadBemEstar, saveBemEstar } from "@/lib/services/habitos-service";

export const Route = createFileRoute("/meu-bem-estar")({
  head: () => ({
    meta: [
      { title: `Meu Bem-estar — ${BRANDING.shortName}` },
      { name: "description", content: "Seu resumo completo de bem-estar do dia." },
    ],
  }),
  component: BemEstarPage,
});

function BemEstarPage() {
  const { isAuthorized, loading: authLoading } = useRequireAuth("companion");
  const { session } = useAuth();

  const [water, setWater] = useState(0);
  const [sleepQuality, setSleepQuality] = useState(50);
  const [mood, setMood] = useState("");
  const [movementMinutes, setMovementMinutes] = useState(0);
  const [energyLevel, setEnergyLevel] = useState(50);
  const [meals, setMeals] = useState<string[]>([]);
  const [goal, setGoal] = useState(2000);
  const [fromCheckin, setFromCheckin] = useState({ water: false, sleep: false, mood: false });
  const [hasCheckin, setHasCheckin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const accessToken = session ?? null;

  useEffect(() => {
    if (!accessToken || loaded) return;
    (async () => {
      const state = await loadBemEstar();
      setWater(state.water);
      setSleepQuality(state.sleepQuality);
      setMood(state.mood);
      setMovementMinutes(state.movementMinutes);
      setEnergyLevel(state.energyLevel);
      setMeals(state.meals);
      setGoal(state.goal);
      setFromCheckin(state.fromCheckin);
      setHasCheckin(state.hasCheckin);
      setLoaded(true);
    })();
  }, [accessToken, loaded]);

  const handleSave = useCallback(async () => {
        setSaving(true);
    try {
      const payload: Parameters<typeof saveBemEstar>[0] = {};

      if (!fromCheckin.water) payload.waterMl = water;
      if (!fromCheckin.sleep) payload.sleepQuality = sleepQuality;
      if (!fromCheckin.mood) payload.mood = mood;
      payload.movementMinutes = movementMinutes;
      payload.energyLevel = energyLevel;
      payload.meals = meals;

      await saveBemEstar(payload);
      setLastSaved(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }, [accessToken, water, sleepQuality, mood, movementMinutes, energyLevel, meals, fromCheckin]);

  const hasEdits = !fromCheckin.water || !fromCheckin.sleep || !fromCheckin.mood ||
    movementMinutes > 0 || energyLevel !== 50 || meals.length > 0;

  if (authLoading || !isAuthorized) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <ClayLoader size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="block md:hidden">
        <MobileBemEstarPage
          water={water}
          sleepQuality={sleepQuality}
          mood={mood}
          movementMinutes={movementMinutes}
          energyLevel={energyLevel}
          meals={meals}
          goal={goal}
          fromCheckin={fromCheckin}
          hasCheckin={hasCheckin}
          saving={saving}
          lastSaved={lastSaved}
          hasEdits={hasEdits}
          onSave={handleSave}
          onWaterChange={setWater}
          onSleepChange={setSleepQuality}
          onMoodChange={setMood}
          onMovementChange={setMovementMinutes}
          onEnergyChange={setEnergyLevel}
          onMealToggle={(meal) => setMeals((prev) =>
            prev.includes(meal) ? prev.filter((m) => m !== meal) : [...prev, meal]
          )}
        />
      </div>
      <div className="hidden md:block">
        <DesktopBemEstarPage
          water={water}
          sleepQuality={sleepQuality}
          mood={mood}
          movementMinutes={movementMinutes}
          energyLevel={energyLevel}
          meals={meals}
          goal={goal}
          fromCheckin={fromCheckin}
          hasCheckin={hasCheckin}
          saving={saving}
          lastSaved={lastSaved}
          hasEdits={hasEdits}
          onSave={handleSave}
          onWaterChange={setWater}
          onSleepChange={setSleepQuality}
          onMoodChange={setMood}
          onMovementChange={setMovementMinutes}
          onEnergyChange={setEnergyLevel}
          onMealToggle={(meal) => setMeals((prev) =>
            prev.includes(meal) ? prev.filter((m) => m !== meal) : [...prev, meal]
          )}
        />
      </div>
    </>
  );
}
