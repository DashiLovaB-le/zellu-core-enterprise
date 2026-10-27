import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ManagerShell } from "@/components/ManagerShell";
import { Icon } from "@/components/Icon";
import { ClayLoader } from "@/components/ClayLoader";
import { useAuth } from "@/lib/auth-context";
import { BRANDING } from "@/lib/branding";
import { loadRhDashboard } from "@/lib/services/rh-dashboard-service";
import { loadTeamRoster } from "@/lib/services/manager-service";
import type { ManagerTeamRoster, RhDashboardData } from "@/lib/api/manager.server";
import { teamsToObjects } from "@/features/rh-map/teams-to-objects";
import { RhMapPanel } from "@/features/rh-map/RhMapPanel";
import { RhMapFloorPlan } from "@/features/rh-map/RhMapFloorPlan";
import { useSpatialSupport } from "@/spatial/use-spatial-support";
import { useReducedMotion } from "@/spatial/use-reduced-motion";
import { SpatialErrorBoundary } from "@/spatial/SpatialErrorBoundary";
import type { SpatialObject } from "@/spatial/types";

const RhMapScene = lazy(() => import("@/features/rh-map/RhMapScene"));

export const Route = createFileRoute("/manager/mapa")({
  head: () => ({
    meta: [
      { title: `Mapa da empresa — ${BRANDING.shortName}` },
      {
        name: "description",
        content: "Visão espacial das equipes com indicadores agregados de bem-estar.",
      },
    ],
  }),
  component: RhMap,
});

function RhMap() {
  const { user, session, loading, role } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<RhDashboardData | null>(null);
  const [roster, setRoster] = useState<ManagerTeamRoster | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedOccupantId, setSelectedOccupantId] = useState<string | null>(null);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", replace: true });
      return;
    }
    if (role === "dev") return;
    if (!loading && user && role && role !== "manager") {
      navigate({ to: role === "admin" ? "/dashiadmin" : "/", replace: true });
    }
  }, [user, loading, role, navigate]);

  useEffect(() => {
    if (!session || loaded) return;
    let cancelled = false;
    (async () => {
      const [dashboard, teamRoster] = await Promise.all([loadRhDashboard(), loadTeamRoster()]);
      if (cancelled) return;
      setData(dashboard);
      setRoster(teamRoster);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [session, loaded]);

  const objects = useMemo(
    () => (data ? teamsToObjects(data.teams, data.alerts, roster) : []),
    [data, roster],
  );

  const selectTeam = (id: string | null) => {
    setSelectedId(id);
    setSelectedOccupantId(null);
    if (id) setPanelCollapsed(false);
  };

  const selectOccupant = (teamObjectId: string, occupantId: string) => {
    setSelectedId(teamObjectId);
    setSelectedOccupantId(occupantId);
    setPanelCollapsed(false);
  };

  if (loading || !user || (role !== "manager" && role !== "dev")) {
    return (
      <ManagerShell>
        <div className="flex flex-1 items-center justify-center">
          <ClayLoader size="lg" />
        </div>
      </ManagerShell>
    );
  }

  return (
    <ManagerShell layout="wide" navCollapsed={navCollapsed} onNavCollapsedChange={setNavCollapsed}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-[var(--clay-title)]">Mapa da empresa</h1>
          <p className="mt-1 max-w-prose text-xs text-[var(--clay-text)]/75">
            Cada bonequinho é um colaborador. Clique na pessoa para ver a ficha — o chão da sala
            mostra só o estado agregado da equipe.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = !(navCollapsed && panelCollapsed);
              setNavCollapsed(next);
              setPanelCollapsed(next);
            }}
            className="flex items-center gap-2 rounded-xl bg-white/60 px-3 py-2 text-xs font-semibold text-[var(--clay-title)] shadow-sm hover:bg-white/80"
          >
            <Icon name={navCollapsed && panelCollapsed ? "menu_open" : "close_fullscreen"} className="text-base" />
            {navCollapsed && panelCollapsed ? "Mostrar menus" : "Ampliar cena"}
          </button>
          <Link
            to="/manager/rh-dashboard"
            className="flex items-center gap-2 rounded-xl bg-white/60 px-4 py-2 text-xs font-semibold text-[var(--clay-title)] shadow-sm hover:bg-white/80"
          >
            <Icon name="dashboard" className="text-base" />
            Visão painel
          </Link>
        </div>
      </div>

      <div className="mt-4">
        {!loaded ? (
          <div className="flex h-72 items-center justify-center">
            <ClayLoader size="lg" />
          </div>
        ) : !data ? (
          <EmptyState
            icon="cloud_off"
            title="Não foi possível carregar o mapa"
            text="Verifique sua conexão e tente de novo."
            action={
              <button
                type="button"
                onClick={() => setLoaded(false)}
                className="rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] px-4 py-2 text-xs font-semibold text-[oklch(0.25_0.04_254)] shadow-sm"
              >
                Tentar novamente
              </button>
            }
          />
        ) : objects.length === 0 ? (
          <EmptyState
            icon="groups"
            title="Nenhuma equipe no mapa ainda"
            text="Crie equipes e convide pessoas para que as salas apareçam aqui."
            action={
              <Link
                to="/manager/equipes"
                className="rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] px-4 py-2 text-xs font-semibold text-[oklch(0.25_0.04_254)] shadow-sm"
              >
                Criar equipe
              </Link>
            }
          />
        ) : (
          <div
            className={`grid grid-cols-1 gap-3 ${
              panelCollapsed ? "lg:grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_300px]"
            }`}
          >
            <MapStage
              objects={objects}
              selectedId={selectedId}
              selectedOccupantId={selectedOccupantId}
              onSelect={selectTeam}
              onSelectOccupant={selectOccupant}
              expanded={navCollapsed && panelCollapsed}
              onTogglePanel={() => setPanelCollapsed((value) => !value)}
              panelCollapsed={panelCollapsed}
            />
            {panelCollapsed ? null : (
              <aside className="rounded-2xl bg-white/60 p-4 shadow-sm lg:max-h-[calc(100dvh-9.5rem)] lg:overflow-y-auto">
                <div className="mb-3 hidden justify-end lg:flex">
                  <button
                    type="button"
                    onClick={() => setPanelCollapsed(true)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[var(--clay-title)]/70 hover:bg-white/70"
                  >
                    Recolher
                    <Icon name="chevron_right" className="text-sm" />
                  </button>
                </div>
                <RhMapPanel
                  data={data}
                  objects={objects}
                  selectedId={selectedId}
                  selectedOccupantId={selectedOccupantId}
                  onSelect={selectTeam}
                  onSelectOccupant={selectOccupant}
                />
              </aside>
            )}
          </div>
        )}
      </div>
    </ManagerShell>
  );
}

function MapStage({
  objects,
  selectedId,
  selectedOccupantId,
  onSelect,
  onSelectOccupant,
  expanded,
  panelCollapsed,
  onTogglePanel,
}: {
  objects: SpatialObject[];
  selectedId: string | null;
  selectedOccupantId: string | null;
  onSelect: (id: string | null) => void;
  onSelectOccupant: (teamObjectId: string, occupantId: string) => void;
  expanded: boolean;
  panelCollapsed: boolean;
  onTogglePanel: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const { support, visible } = useSpatialSupport(hostRef);
  const reducedMotion = useReducedMotion();

  const floorPlan = (
    <RhMapFloorPlan objects={objects} selectedId={selectedId} onSelect={onSelect} />
  );

  return (
    <div ref={hostRef} className="min-w-0">
      {support.mode === "3d" ? (
        <div
          role="img"
          aria-label={`Mapa 3D com ${objects.length} equipes. Clique num colaborador para ver a ficha. Use a lista ao lado para navegar pelo teclado.`}
          className={`relative overflow-hidden rounded-3xl bg-[radial-gradient(ellipse_at_50%_35%,#fbf7ee_0%,#efe7d6_70%,#e6dcc7_100%)] shadow-[0_8px_30px_rgba(74,106,138,0.10)] ${
            expanded ? "h-[calc(100dvh-8.5rem)]" : "h-[min(820px,calc(100dvh-10rem))]"
          }`}
        >
          {visible && (
            <SpatialErrorBoundary fallback={<div className="p-4">{floorPlan}</div>}>
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center">
                    <ClayLoader size="lg" />
                  </div>
                }
              >
                <RhMapScene
                  objects={objects}
                  selectedId={selectedId}
                  selectedOccupantId={selectedOccupantId}
                  onSelect={onSelect}
                  onSelectOccupant={onSelectOccupant}
                  reducedMotion={reducedMotion}
                />
              </Suspense>
            </SpatialErrorBoundary>
          )}
          {selectedId && (
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-xs font-semibold text-[var(--clay-title)] shadow-[0_2px_10px_rgba(74,106,138,0.14)] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a6a8a]"
            >
              <Icon name="zoom_out_map" className="text-base" />
              Visão geral
            </button>
          )}
          {panelCollapsed && (
            <button
              type="button"
              onClick={onTogglePanel}
              className="absolute right-4 top-14 flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-xs font-semibold text-[var(--clay-title)] shadow-[0_2px_10px_rgba(74,106,138,0.14)] hover:bg-white lg:top-4 lg:right-4"
              style={selectedId ? { top: "3.5rem" } : undefined}
            >
              <Icon name="view_sidebar" className="text-base" />
              Detalhes
            </button>
          )}
          <p className="pointer-events-none absolute bottom-4 left-4 text-[11px] text-[var(--clay-text)]/65">
            Arraste para girar · scroll para zoom · clique no colaborador
          </p>
        </div>
      ) : support.mode === "2d" ? (
        <div className="flex flex-col gap-3">
          <p className="text-[11px] text-[var(--clay-text)]/70">
            {support.reason === "webgl"
              ? "Seu navegador não suporta a visão 3D. Mostrando a planta das equipes."
              : "A visão 3D aparece em telas maiores. Toque numa equipe para ver os detalhes."}
          </p>
          {floorPlan}
        </div>
      ) : (
        <div className="flex h-72 items-center justify-center">
          <ClayLoader size="lg" />
        </div>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: string;
  title: string;
  text: string;
  action: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl bg-white/50 px-6 py-14 text-center shadow-sm">
      <Icon name={icon} className="text-3xl text-[var(--clay-title)]/60" />
      <h2 className="font-display text-lg text-[var(--clay-title)]">{title}</h2>
      <p className="max-w-sm text-xs text-[var(--clay-text)]/75">{text}</p>
      {action}
    </div>
  );
}
