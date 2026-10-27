import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Icon } from "@/components/Icon";
import { WellnessStatusBadge } from "@/components/manager/WellnessStatusBadge";
import type { RhAlert, RhDashboardData } from "@/lib/api/manager.server";
import {
  participationLabelPt,
  sleepSignalLabelPt,
  trendLabelPt,
  type RhMemberSummary,
} from "@/lib/rh-member-summary";
import { loadMemberSummary } from "@/lib/services/manager-service";
import { STATUS_ORDER, STATUS_VISUALS } from "@/spatial/status-visuals";
import type { SpatialObject, SpatialOccupant, SpatialStatus } from "@/spatial/types";
import { findOccupant } from "./teams-to-objects";

export function StatusDot({ status, className = "" }: { status: SpatialStatus; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${className}`}
      style={{ backgroundColor: STATUS_VISUALS[status].accent }}
    />
  );
}

export function RhMapPanel({
  data,
  objects,
  selectedId,
  selectedOccupantId,
  onSelect,
  onSelectOccupant,
}: {
  data: RhDashboardData;
  objects: SpatialObject[];
  selectedId: string | null;
  selectedOccupantId: string | null;
  onSelect: (id: string | null) => void;
  onSelectOccupant: (teamObjectId: string, occupantId: string) => void;
}) {
  const occupantHit = findOccupant(objects, selectedOccupantId);
  if (occupantHit) {
    const team = data.teams.find((item) => item.name === occupantHit.object.entityId);
    return (
      <MemberDetail
        occupant={occupantHit.occupant}
        object={occupantHit.object}
        teamName={team?.name ?? occupantHit.object.label}
        onBack={() => onSelect(occupantHit.object.id)}
      />
    );
  }

  const selected = objects.find((o) => o.id === selectedId) ?? null;
  if (selected) {
    const team = data.teams.find((t) => t.name === selected.entityId);
    const alerts = data.alerts.filter((a) => a.team === selected.entityId);
    return team ? (
      <TeamDetail
        object={selected}
        team={team}
        alerts={selected.status === "protected" ? [] : alerts}
        onBack={() => onSelect(null)}
        onSelectOccupant={(occupantId) => onSelectOccupant(selected.id, occupantId)}
      />
    ) : null;
  }
  return <Overview data={data} objects={objects} onSelect={onSelect} />;
}

function Overview({
  data,
  objects,
  onSelect,
}: {
  data: RhDashboardData;
  objects: SpatialObject[];
  onSelect: (id: string) => void;
}) {
  const counts = STATUS_ORDER.map((status) => ({
    status,
    count: objects.filter((o) => o.status === status).length,
  })).filter((c) => c.count > 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-lg text-[var(--clay-title)]">Visão geral</h2>
        <p className="mt-1 text-xs leading-relaxed text-[var(--clay-text)]/75">
          {objects.length} {objects.length === 1 ? "equipe" : "equipes"} · {data.totalUsers}{" "}
          colaboradores · adesão semanal de {data.weeklyAdhesion}%
        </p>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Legenda de status">
        {counts.map(({ status, count }) => (
          <li key={status} className="flex items-center gap-1.5 text-xs text-[var(--clay-text)]">
            <StatusDot status={status} />
            {STATUS_VISUALS[status].label}
            <span className="tabular-nums text-[var(--clay-text)]/60">{count}</span>
          </li>
        ))}
      </ul>

      <div>
        <h3 className="mb-2 text-xs font-semibold text-[var(--clay-title)]">Equipes</h3>
        <ul className="flex flex-col gap-1">
          {objects.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => onSelect(o.id)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-[var(--clay-text)] transition-colors hover:bg-white/70 focus-visible:bg-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a6a8a]"
              >
                <StatusDot status={o.status} />
                <span className="min-w-0 flex-1 truncate font-medium">{o.label}</span>
                {o.alertCount > 0 && (
                  <span className="flex items-center gap-0.5 text-[11px] font-semibold text-[#b5543a]">
                    <Icon name="warning" filled className="text-sm" />
                    {o.alertCount}
                  </span>
                )}
                <Icon name="chevron_right" className="text-base text-[var(--clay-text)]/40" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TeamDetail({
  object,
  team,
  alerts,
  onBack,
  onSelectOccupant,
}: {
  object: SpatialObject;
  team: RhDashboardData["teams"][number];
  alerts: RhAlert[];
  onBack: () => void;
  onSelectOccupant: (occupantId: string) => void;
}) {
  const visual = STATUS_VISUALS[object.status];
  const isProtected = object.status === "protected";

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit items-center gap-1.5 rounded-lg text-xs font-semibold text-[var(--clay-title)] hover:text-[var(--clay-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a6a8a]"
      >
        <Icon name="arrow_back" className="text-base" />
        Voltar à visão geral
      </button>

      <div>
        <h2 className="font-display text-xl text-[var(--clay-title)] [text-wrap:balance]">
          {team.name}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--clay-text)]/75">
          <span
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold text-[var(--clay-text)]"
            style={{ backgroundColor: visual.base }}
          >
            <StatusDot status={object.status} />
            {visual.label}
          </span>
          <span className="tabular-nums">{team.memberCount} membros</span>
        </div>
      </div>

      {isProtected ? (
        <p className="rounded-xl bg-white/60 px-3 py-3 text-xs leading-relaxed text-[var(--clay-text)]/85">
          Esta equipe tem menos de 5 pessoas com compartilhamento autorizado. Os indicadores ficam
          ocultos para preservar o anonimato de cada colaborador.
        </p>
      ) : (
        <dl className="grid grid-cols-2 gap-2">
          <Metric label="Humor médio" value={String(team.avgMood)} unit="/5" />
          <Metric label="Sono médio" value={String(team.avgSleep)} unit="h" />
          <Metric label="Água média" value={String(team.avgWater)} unit="ml" />
          <Metric label="Humor negativo" value={`${team.negativeMoodPct}%`} />
        </dl>
      )}

      {object.occupants.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold text-[var(--clay-title)]">Colaboradores na sala</h3>
          <ul className="flex flex-col gap-1">
            {object.occupants.map((occupant) => (
              <li key={occupant.id}>
                <button
                  type="button"
                  onClick={() => onSelectOccupant(occupant.id)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[var(--clay-text)] transition-colors hover:bg-white/70"
                >
                  <Icon name="person" className="text-base text-[var(--clay-title)]/70" />
                  <span className="min-w-0 flex-1 truncate font-medium">{occupant.name}</span>
                  <Icon name="chevron_right" className="text-base text-[var(--clay-text)]/40" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {alerts.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold text-[var(--clay-title)]">Alertas</h3>
          <ul className="flex flex-col gap-2">
            {alerts.map((a) => (
              <li
                key={a.id}
                className="flex items-start gap-2 rounded-xl bg-[#f5d6c1]/55 px-3 py-2 text-xs leading-relaxed text-[var(--clay-text)]"
              >
                <Icon
                  name={a.severity === "low" ? "info" : "warning"}
                  filled
                  className="mt-0.5 shrink-0 text-sm text-[#b5543a]"
                />
                {a.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Link
          to="/manager/equipes"
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] px-4 py-2.5 text-xs font-semibold text-[oklch(0.25_0.04_254)] shadow-sm"
        >
          <Icon name="groups" className="text-base" />
          Gerenciar equipes
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/manager/convites"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-white/70 px-3 py-2 text-xs font-semibold text-[var(--clay-title)] shadow-sm hover:bg-white"
          >
            <Icon name="person_add" className="text-base" />
            Convidar
          </Link>
          <Link
            to="/manager/relatorios"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-white/70 px-3 py-2 text-xs font-semibold text-[var(--clay-title)] shadow-sm hover:bg-white"
          >
            <Icon name="bar_chart" className="text-base" />
            Relatórios
          </Link>
        </div>
      </div>
    </div>
  );
}

function MemberDetail({
  occupant,
  object,
  teamName,
  onBack,
}: {
  occupant: SpatialOccupant;
  object: SpatialObject;
  teamName: string;
  onBack: () => void;
}) {
  const [summary, setSummary] = useState<RhMemberSummary | null>(null);
  const [loading, setLoading] = useState(Boolean(occupant.memberId));

  useEffect(() => {
    if (!occupant.memberId) {
      setSummary(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void loadMemberSummary(occupant.memberId).then((data) => {
      if (cancelled) return;
      setSummary(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [occupant.memberId]);

  const metricsHidden = object.status === "protected";
  const name = occupant.name;
  const job = summary?.jobTitle ?? occupant.jobTitle;
  const email = summary?.email ?? occupant.email;

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit items-center gap-1.5 rounded-lg text-xs font-semibold text-[var(--clay-title)] hover:text-[var(--clay-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a6a8a]"
      >
        <Icon name="arrow_back" className="text-base" />
        Voltar à equipe
      </button>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--clay-text)]/55">
          {teamName}
        </p>
        <h2 className="mt-1 font-display text-xl text-[var(--clay-title)] [text-wrap:balance]">{name}</h2>
        {job && <p className="mt-1 text-sm text-[var(--clay-text)]/80">{job}</p>}
        {email && <p className="mt-0.5 text-xs text-[var(--clay-text)]/65">{email}</p>}
      </div>

      {metricsHidden && (
        <p className="rounded-xl bg-white/60 px-3 py-3 text-xs leading-relaxed text-[var(--clay-text)]/85">
          Os indicadores agregados desta equipe estão ocultos por k-anonimato. A ficha operacional
          abaixo não inclui humor, diário nem conversas.
        </p>
      )}

      {!occupant.memberId ? (
        <p className="rounded-xl bg-white/60 px-3 py-3 text-xs leading-relaxed text-[var(--clay-text)]/85">
          Este bonequinho representa alguém da equipe, mas ainda não há um cadastro associado no
          diretório.
        </p>
      ) : loading ? (
        <p className="text-xs text-[var(--clay-text)]/70">Carregando ficha operacional…</p>
      ) : summary ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <WellnessStatusBadge status={summary.wellness.status} available={summary.wellness.available} />
            {summary.wellness.available && (
              <span className="text-[11px] text-[var(--clay-text)]/70">
                {trendLabelPt(summary.wellness.trend)}
              </span>
            )}
          </div>
          {summary.wellness.available ? (
            <ul className="flex flex-col gap-1.5 text-xs text-[var(--clay-text)]/85">
              <li>{participationLabelPt(summary.wellness.participation)}</li>
              <li>{summary.wellness.lastActivity}</li>
              <li>{sleepSignalLabelPt(summary.wellness.sleepSignal)}</li>
            </ul>
          ) : (
            <p className="text-xs leading-relaxed text-[var(--clay-text)]/75">
              Sem sinais individuais para exibir. Humor, diário e conversas nunca aparecem neste mapa.
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-[var(--clay-text)]/75">Não foi possível carregar a ficha desta pessoa.</p>
      )}

      {occupant.memberId && (
        <Link
          to="/manager/colaborador/$profileId"
          params={{ profileId: occupant.memberId }}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] px-4 py-2.5 text-xs font-semibold text-[oklch(0.25_0.04_254)] shadow-sm"
        >
          <Icon name="person" className="text-base" />
          Abrir ficha completa
        </Link>
      )}
    </div>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-xl bg-white/60 px-3 py-2">
      <dt className="text-[11px] text-[var(--clay-text)]/70">{label}</dt>
      <dd className="mt-0.5 font-display text-base font-bold tabular-nums text-[var(--clay-title)]">
        {value}
        {unit && <span className="ml-0.5 text-[11px] font-normal text-[var(--clay-text)]/60">{unit}</span>}
      </dd>
    </div>
  );
}
