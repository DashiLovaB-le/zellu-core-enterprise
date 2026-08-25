import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { AdminShell } from "@/components/AdminShell";
import { Icon } from "@/components/Icon";
import { ClayLoader } from "@/components/ClayLoader";

/** Gate de autenticação para rotas /admin/* (admin + dev). */
export function useAdminGate() {
  const { user, session, loading, role } = useAuth();
  const navigate = useNavigate();
  const allowed = role === "admin" || role === "dev";

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login", replace: true });
      return;
    }
    if (!role) return;
    if (!allowed) {
      const target = role === "manager" ? "/manager/rh-dashboard" : "/";
      navigate({ to: target, replace: true });
    }
  }, [user, loading, role, allowed, navigate]);

  return {
    user,
    session,
    loading: loading || (!!user && !role),
    role,
    isAuthorized: !!user && allowed,
  };
}

export function AdminPageFrame({
  children,
  loading,
}: {
  children?: ReactNode;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <AdminShell>
        <div className="flex flex-1 items-center justify-center py-20">
          <ClayLoader size="lg" className="text-slate-400" />
        </div>
      </AdminShell>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}

export function AdminKpiCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon name={icon} className="text-base" />
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl text-slate-800">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

export function AdminSection({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-sm font-semibold text-slate-800 md:text-base">
            {title}
          </h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700",
    trial: "bg-sky-50 text-sky-700",
    inactive: "bg-slate-100 text-slate-600",
    churned: "bg-rose-50 text-rose-700",
    expired: "bg-amber-50 text-amber-700",
    suspended: "bg-orange-50 text-orange-700",
    draft: "bg-slate-100 text-slate-600",
    cancelled: "bg-rose-50 text-rose-700",
  };
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        colors[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}
