-- Tour educativo do companion (primeiro uso após onboarding LGPD).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS product_tour_completed_at TIMESTAMPTZ;
