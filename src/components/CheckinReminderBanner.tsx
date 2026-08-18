import { Link } from "@tanstack/react-router";

export function CheckinReminderBanner({ done }: { done: boolean }) {
  if (done) return null;
  return (
    <Link
      to="/checkin"
      className="mb-4 flex items-center justify-between rounded-2xl bg-[var(--clay-stress)]/30 px-4 py-3 text-sm text-[var(--clay-title)] shadow-sm"
    >
      <span>Você ainda não fez o check-in de hoje.</span>
      <span className="text-xs font-semibold">Registrar</span>
    </Link>
  );
}
