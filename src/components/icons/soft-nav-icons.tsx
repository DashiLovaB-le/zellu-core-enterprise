import type { ReactElement, ReactNode, SVGProps } from "react";

export type SoftIconProps = SVGProps<SVGSVGElement> & {
  filled?: boolean;
};

function SoftSvg({
  filled: _filled = false,
  children,
  className = "",
  ...rest
}: SoftIconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      className={className}
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

const stroke = {
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function softFill(filled?: boolean) {
  return filled ? "var(--icon-fill)" : "none";
}

/** Dashboard / métricas — ondas suaves */
export function IconMonitoring({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <path
        d="M4 14.5c1.2-2.2 2.4-3.5 4-3.5s2.6 2 4 3.5 2.6 3.5 4 3.5 2.8-1.3 4-3.5"
        {...stroke}
        fill="none"
      />
      <path
        d="M4 9.5c1.2-2 2.4-3.2 4-3.2s2.6 1.8 4 3.2 2.6 3.2 4 3.2 2.8-1.2 4-3.2"
        {...stroke}
        fill={softFill(filled)}
        opacity={0.55}
      />
    </SoftSvg>
  );
}

/** Check-in — lista com checks arredondados */
export function IconChecklist({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <rect x="3.75" y="3.75" width="16.5" height="16.5" rx="5" {...stroke} fill={softFill(filled)} />
      <path d="M8 9.2h8" {...stroke} />
      <path d="M8 12.5h8" {...stroke} />
      <path d="M8 15.8h5" {...stroke} />
      <path d="M7.2 9.1l1.1 1.1 2.2-2.3" {...stroke} opacity={0.7} />
    </SoftSvg>
  );
}

/** Chat — balão macio */
export function IconChatBubble({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <path
        d="M7.5 18.2c-2.6-.4-4-2.2-4-4.7V9.8C3.5 6.9 5.8 4.5 9 4.5h6c3.2 0 5.5 2.4 5.5 5.3v3.7c0 2.9-2.3 5.3-5.5 5.3h-2.2L9.2 20.4c-.4.3-.9 0-.9-.5v-1.7Z"
        {...stroke}
        fill={softFill(filled)}
      />
      <circle cx="9.2" cy="11.2" r="0.9" fill="currentColor" opacity={0.55} />
      <circle cx="12" cy="11.2" r="0.9" fill="currentColor" opacity={0.55} />
      <circle cx="14.8" cy="11.2" r="0.9" fill="currentColor" opacity={0.55} />
    </SoftSvg>
  );
}

/** Diário — livro aberto */
export function IconAutoStories({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <path
        d="M12 6.2c-1.6-1-3.6-1.5-5.8-1.5-.9 0-1.7.1-2.4.3v12.1c.8-.3 1.7-.4 2.6-.4 2.1 0 4 .6 5.6 1.6 1.6-1 3.5-1.6 5.6-1.6.9 0 1.8.1 2.6.4V5c-.7-.2-1.5-.3-2.4-.3-2.2 0-4.2.5-5.8 1.5Z"
        {...stroke}
        fill={softFill(filled)}
      />
      <path d="M12 6.2v12.1" {...stroke} />
    </SoftSvg>
  );
}

/** Plano — figura em postura suave / folha */
export function IconSelfImprovement({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <circle cx="12" cy="6.2" r="2.4" {...stroke} fill={softFill(filled)} />
      <path
        d="M8.2 20.2c.6-3.2 2-5.2 3.8-5.2s3.2 2 3.8 5.2"
        {...stroke}
        fill="none"
      />
      <path
        d="M7 13.2c1.6-1.4 3.2-2.1 5-2.1s3.4.7 5 2.1"
        {...stroke}
        fill={softFill(filled)}
      />
    </SoftSvg>
  );
}

/** Bem-estar — coração macio */
export function IconFavorite({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <path
        d="M12 19.2c-.4 0-7.2-4.2-7.2-9.1 0-2.6 2-4.4 4.3-4.4 1.4 0 2.4.7 2.9 1.5.5-.8 1.5-1.5 2.9-1.5 2.3 0 4.3 1.8 4.3 4.4 0 4.9-6.8 9.1-7.2 9.1Z"
        {...stroke}
        fill={softFill(filled)}
      />
    </SoftSvg>
  );
}

/** Respiro — brisa / ondas de ar */
export function IconAir({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <path d="M4.5 9.2h9.2c1.6 0 2.8-1.2 2.8-2.6S15.3 4 13.7 4" {...stroke} />
      <path
        d="M4.5 12.5h12.2c1.8 0 3.2-1.3 3.2-3"
        {...stroke}
        fill={softFill(filled)}
      />
      <path d="M4.5 15.8h8.5c1.5 0 2.6 1.1 2.6 2.5s-1.2 2.5-2.6 2.5" {...stroke} />
    </SoftSvg>
  );
}

/** Perfil — silhueta fofa outline */
export function IconPerson({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <circle cx="12" cy="8" r="3.4" {...stroke} fill={softFill(filled)} />
      <path
        d="M5.8 19.2c0-3.3 2.7-5.4 6.2-5.4s6.2 2.1 6.2 5.4"
        {...stroke}
        fill={softFill(filled)}
      />
    </SoftSvg>
  );
}

/** Dashboard RH / KPIs — tiles arredondados */
export function IconDashboard({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <rect x="3.8" y="3.8" width="7" height="7" rx="2.2" {...stroke} fill={softFill(filled)} />
      <rect x="13.2" y="3.8" width="7" height="4.8" rx="2" {...stroke} fill="none" />
      <rect x="3.8" y="13.2" width="7" height="7" rx="2.2" {...stroke} fill="none" />
      <rect x="13.2" y="11" width="7" height="9.2" rx="2.2" {...stroke} fill={softFill(filled)} />
    </SoftSvg>
  );
}

/** Equipes — dois personagens macios */
export function IconGroups({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <circle cx="9" cy="8.2" r="2.6" {...stroke} fill={softFill(filled)} />
      <path d="M4.2 18.5c0-2.6 2.1-4.3 4.8-4.3" {...stroke} fill="none" />
      <circle cx="15.4" cy="8.6" r="2.3" {...stroke} fill="none" />
      <path
        d="M12.2 18.5c0-2.4 1.9-4 4.4-4 2.5 0 4.4 1.6 4.4 4"
        {...stroke}
        fill={softFill(filled)}
      />
    </SoftSvg>
  );
}

/** Relatórios — barras suaves */
export function IconBarChart({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <rect x="4.2" y="11.5" width="3.6" height="7.2" rx="1.6" {...stroke} fill={softFill(filled)} />
      <rect x="10.2" y="6.5" width="3.6" height="12.2" rx="1.6" {...stroke} fill="none" />
      <rect x="16.2" y="9" width="3.6" height="9.7" rx="1.6" {...stroke} fill={softFill(filled)} />
    </SoftSvg>
  );
}

/** Pessoas / convites — perfil + plus */
export function IconPersonAdd({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <circle cx="9.2" cy="8" r="3" {...stroke} fill={softFill(filled)} />
      <path d="M3.8 19c0-2.9 2.3-4.8 5.4-4.8" {...stroke} fill="none" />
      <path d="M16.2 10.5v6.2" {...stroke} />
      <path d="M13.1 13.6h6.2" {...stroke} />
    </SoftSvg>
  );
}

/** Voltar */
export function IconArrowBack({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <path d="M14.8 5.5 8.2 12l6.6 6.5" {...stroke} fill="none" />
      <path d="M8.5 12h9.2" {...stroke} opacity={0.55} />
    </SoftSvg>
  );
}

/** Empresas — prédio macio */
export function IconApartment({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <path
        d="M6.2 20.2V7.4c0-1.2.9-2.1 2-2.1h7.6c1.1 0 2 .9 2 2.1v12.8"
        {...stroke}
        fill={softFill(filled)}
      />
      <path d="M4.5 20.2h15" {...stroke} />
      <path d="M9.2 9.2h1.6M13.2 9.2h1.6M9.2 12.4h1.6M13.2 12.4h1.6M9.2 15.6h1.6M13.2 15.6h1.6" {...stroke} />
    </SoftSvg>
  );
}

/** Funcionários — crachá */
export function IconBadge({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <rect x="5.2" y="6.2" width="13.6" height="13.2" rx="3.2" {...stroke} fill={softFill(filled)} />
      <path d="M9.2 6.2V5.4c0-.8.7-1.4 1.5-1.4h2.6c.8 0 1.5.6 1.5 1.4v.8" {...stroke} />
      <circle cx="12" cy="12" r="2.1" {...stroke} fill="none" />
      <path d="M8.8 17.2c.7-1.3 1.8-2 3.2-2s2.5.7 3.2 2" {...stroke} />
    </SoftSvg>
  );
}

/** Licenças — check em círculo */
export function IconVerified({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <circle cx="12" cy="12" r="8.2" {...stroke} fill={softFill(filled)} />
      <path d="M8.2 12.2l2.4 2.4 5.2-5.4" {...stroke} />
    </SoftSvg>
  );
}

/** Sentimentos — carinha suave */
export function IconSentimentSatisfied({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <circle cx="12" cy="12" r="8.2" {...stroke} fill={softFill(filled)} />
      <circle cx="9.2" cy="10.4" r="1" fill="currentColor" />
      <circle cx="14.8" cy="10.4" r="1" fill="currentColor" />
      <path d="M8.8 13.8c.9 1.5 2 2.3 3.2 2.3s2.3-.8 3.2-2.3" {...stroke} />
    </SoftSvg>
  );
}

/** Alertas — sino macio */
export function IconNotificationsActive({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <path
        d="M12 4.4c-3.1 0-5.4 2.3-5.4 5.3v2.1c0 .7-.4 1.6-.9 2.2l-.4.5c-.5.6-.1 1.5.7 1.5h12c.8 0 1.2-.9.7-1.5l-.4-.5c-.5-.6-.9-1.5-.9-2.2V9.7c0-3-2.3-5.3-5.4-5.3Z"
        {...stroke}
        fill={softFill(filled)}
      />
      <path d="M10.2 18.2c.4.8 1.1 1.3 1.8 1.3s1.4-.5 1.8-1.3" {...stroke} />
      <circle cx="17.6" cy="6.2" r="1.6" fill="currentColor" opacity={0.75} />
    </SoftSvg>
  );
}

/** Export / download */
export function IconDownload({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <path d="M12 4.5v10.2" {...stroke} />
      <path d="M8.2 11.2 12 15.2l3.8-4" {...stroke} />
      <path
        d="M5.2 17.2c0 1.4 1.2 2.3 2.6 2.3h8.4c1.4 0 2.6-.9 2.6-2.3"
        {...stroke}
        fill={softFill(filled)}
      />
    </SoftSvg>
  );
}

/** Dev tools — chave macia */
export function IconBuild({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <path
        d="M14.8 5.2a3.6 3.6 0 0 0-4.9 4.9l-5.2 5.2c-.6.6-.6 1.5 0 2.1l1.1 1.1c.6.6 1.5.6 2.1 0l5.2-5.2a3.6 3.6 0 0 0 4.9-4.9l-2.2 2.2-1.8-.2-.2-1.8 2.2-2.2Z"
        {...stroke}
        fill={softFill(filled)}
      />
    </SoftSvg>
  );
}

/** Editar — lápis macio */
export function IconEdit({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <path
        d="M14.2 5.4c.7-.7 1.8-.7 2.5 0l1.9 1.9c.7.7.7 1.8 0 2.5L9.2 19.2 4.8 20.2l1-4.4L14.2 5.4Z"
        {...stroke}
        fill={softFill(filled)}
      />
      <path d="M12.8 6.8l4.4 4.4" {...stroke} opacity={0.55} />
    </SoftSvg>
  );
}

/** Fechar */
export function IconClose({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <circle cx="12" cy="12" r="8.2" {...stroke} fill={softFill(filled)} />
      <path d="M9 9l6 6M15 9l-6 6" {...stroke} />
    </SoftSvg>
  );
}

/** PDF / documento */
export function IconPictureAsPdf({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <path
        d="M7.2 3.8h6.4L16.8 7v13.2c0 1-.8 1.8-1.8 1.8H7.2c-1 0-1.8-.8-1.8-1.8V5.6c0-1 .8-1.8 1.8-1.8Z"
        {...stroke}
        fill={softFill(filled)}
      />
      <path d="M13.4 3.9V7h3.3" {...stroke} />
      <path d="M8.2 12.2h7.6M8.2 15.2h7.6M8.2 18.2h4.8" {...stroke} />
    </SoftSvg>
  );
}

/** Tendência / adesão */
export function IconTrendingUp({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <path d="M4.5 16.5 10 11l3.2 3.2 6.3-6.7" {...stroke} fill="none" />
      <path d="M14.2 7.5h5.3v5.3" {...stroke} />
      <path
        d="M4.5 18.8h15"
        {...stroke}
        opacity={0.45}
        fill={softFill(filled)}
      />
    </SoftSvg>
  );
}

/** Gráfico de linhas */
export function IconShowChart({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <path
        d="M4.5 16.2 8.8 11l3.4 3.2 7.3-8.4"
        {...stroke}
        fill="none"
      />
      <circle cx="8.8" cy="11" r="1.2" fill="currentColor" opacity={0.55} />
      <circle cx="12.2" cy="14.2" r="1.2" fill="currentColor" opacity={0.55} />
      <circle cx="19.5" cy="5.8" r="1.2" fill="currentColor" opacity={filled ? 0.9 : 0.55} />
      <path d="M4.5 19h15" {...stroke} opacity={0.4} />
    </SoftSvg>
  );
}

/** Alerta / warning */
export function IconWarning({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <path
        d="M12 4.6 20.2 18.4c.4.7-.1 1.6-.9 1.6H4.7c-.8 0-1.3-.9-.9-1.6L12 4.6Z"
        {...stroke}
        fill={softFill(filled)}
      />
      <path d="M12 9.5v4.2" {...stroke} />
      <circle cx="12" cy="16.2" r="0.9" fill="currentColor" />
    </SoftSvg>
  );
}

/** Erro */
export function IconError({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <circle cx="12" cy="12" r="8.2" {...stroke} fill={softFill(filled)} />
      <path d="M12 7.8v5.2" {...stroke} />
      <circle cx="12" cy="16.2" r="0.9" fill="currentColor" />
    </SoftSvg>
  );
}

/** Info */
export function IconInfo({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <circle cx="12" cy="12" r="8.2" {...stroke} fill={softFill(filled)} />
      <circle cx="12" cy="8.2" r="0.9" fill="currentColor" />
      <path d="M12 11.2v5.2" {...stroke} />
    </SoftSvg>
  );
}

/** Comparativo */
export function IconCompareArrows({ filled, ...p }: SoftIconProps) {
  return (
    <SoftSvg filled={filled} {...p}>
      <path d="M7.5 8.2h11.2" {...stroke} />
      <path d="M15.5 5.2 18.7 8.2 15.5 11.2" {...stroke} />
      <path d="M16.5 15.8H5.3" {...stroke} />
      <path d="M8.5 12.8 5.3 15.8 8.5 18.8" {...stroke} />
      <path
        d="M4.5 8.2h1.2M18.3 15.8h1.2"
        {...stroke}
        opacity={0.4}
        fill={softFill(filled)}
      />
    </SoftSvg>
  );
}

export const SOFT_NAV_ICONS: Record<
  string,
  (props: SoftIconProps) => ReactElement
> = {
  monitoring: IconMonitoring,
  checklist: IconChecklist,
  chat_bubble: IconChatBubble,
  auto_stories: IconAutoStories,
  self_improvement: IconSelfImprovement,
  favorite: IconFavorite,
  air: IconAir,
  person: IconPerson,
  dashboard: IconDashboard,
  groups: IconGroups,
  bar_chart: IconBarChart,
  person_add: IconPersonAdd,
  arrow_back: IconArrowBack,
  apartment: IconApartment,
  badge: IconBadge,
  verified: IconVerified,
  sentiment_satisfied: IconSentimentSatisfied,
  notifications_active: IconNotificationsActive,
  download: IconDownload,
  build: IconBuild,
  edit: IconEdit,
  close: IconClose,
  picture_as_pdf: IconPictureAsPdf,
  trending_up: IconTrendingUp,
  show_chart: IconShowChart,
  warning: IconWarning,
  error: IconError,
  info: IconInfo,
  compare_arrows: IconCompareArrows,
};
