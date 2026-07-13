import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { MobileBemEstarPage } from "@/components/pages/mobile/BemEstarPage";
import { DesktopBemEstarPage } from "@/components/pages/desktop/BemEstarPage";
import { BRANDING } from "@/lib/branding";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/Icon";
import { loadHabits, persistHabits } from "@/lib/services/habitos-service";

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
  const navigate = useNavigate();

  const [water, setWater] = useState(0);
  const [sleepQuality, setSleepQuality] = useState(50);
  const [mood, setMood] = useState("");
  const [movementMinutes, setMovementMinutes] = useState(0);
  const [energyLevel, setEnergyLevel] = useState(50);
  const [meals, setMeals] = useState<string[]>([]);
  const [goal, setGoal] = useState(2000);
  const [loaded, setLoaded] = useState(false);

  const accessToken = session?.access_token ?? null;

  useEffect(() => {
    if (!accessToken || loaded) return;
    (async () => {
      const data = await loadHabits(accessToken);
      setWater(data.water);
      setSleepQuality(data.sleepQuality);
      setMood(data.mood);
      setMovementMinutes(data.movementMinutes);
      setEnergyLevel(data.energyLevel);
      setMeals(data.meals);
      setGoal(data.goal);
      setLoaded(true);
    })();
  }, [accessToken, loaded]);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const persist = useCallback(
    (partial: Parameters<typeof persistHabits>[1]) => {
      if (!accessToken) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        persistHabits(accessToken, partial);
      }, 800);
    },
    [accessToken],
  );

  const handleWaterChange = useCallback(
    (val: number) => {
      setWater(val);
      persist({ waterMl: val });
    },
    [persist],
  );

  const handleSleepChange = useCallback(
    (val: number) => {
      setSleepQuality(val);
      persist({ sleepQuality: val });
    },
    [persist],
  );

  const handleMoodChange = useCallback(
    (val: string) => {
      setMood(val);
      persist({ mood: val });
    },
    [persist],
  );

  const handleMovementChange = useCallback(
    (val: number) => {
      setMovementMinutes(val);
      persist({ movementMinutes: val });
    },
    [persist],
  );

  const handleEnergyChange = useCallback(
    (val: number) => {
      setEnergyLevel(val);
      persist({ energyLevel: val });
    },
    [persist],
  );

  const handleMealToggle = useCallback(
    (meal: string) => {
      setMeals((prev) => {
        const next = prev.includes(meal) ? prev.filter((m) => m !== meal) : [...prev, meal];
        persist({ meals: next });
        return next;
      });
    },
    [persist],
  );

  if (authLoading || !isAuthorized) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Icon name="sync" className="animate-spin text-3xl text-[var(--clay-title)]" />
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
          onWaterChange={handleWaterChange}
          onSleepChange={handleSleepChange}
          onMoodChange={handleMoodChange}
          onMovementChange={handleMovementChange}
          onEnergyChange={handleEnergyChange}
          onMealToggle={handleMealToggle}
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
          onWaterChange={handleWaterChange}
          onSleepChange={handleSleepChange}
          onMoodChange={handleMoodChange}
          onMovementChange={handleMovementChange}
          onEnergyChange={handleEnergyChange}
          onMealToggle={handleMealToggle}
        />
      </div>
    </>
  );
}
