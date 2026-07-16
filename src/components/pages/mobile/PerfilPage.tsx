import { MobileShell } from "@/components/MobileShell";
import { ManagerShell } from "@/components/ManagerShell";
import { AdminShell } from "@/components/AdminShell";
import { Avatar, AVATAR_LIST } from "@/components/Avatar";
import { Icon } from "@/components/Icon";

interface PerfilPageProps {
  user: { email?: string | null } | null;
  role: string | null;
  displayName: string;
  avatarName: string;
  editing: boolean;
  editName: string;
  nameSuccess: string;
  editingEmail: boolean;
  newEmail: string;
  emailError: string;
  emailSuccess: string;
  editingPassword: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  passwordError: string;
  passwordSuccess: string;
  mode: string;
  editingAvatar: boolean;
  onEditName: () => void;
  onSetEditName: (val: string) => void;
  onSaveName: () => void;
  onCancelName: () => void;
  onSetAvatarName: (name: string) => void;
  onEditAvatar: () => void;
  onCancelAvatar: () => void;
  onSetEditingEmail: (val: boolean) => void;
  onSetNewEmail: (val: string) => void;
  onSaveEmail: () => void;
  onCancelEmail: () => void;
  onSetEditingPassword: (val: boolean) => void;
  onSetCurrentPassword: (val: string) => void;
  onSetNewPassword: (val: string) => void;
  onSetConfirmPassword: (val: string) => void;
  onSavePassword: () => void;
  onCancelPassword: () => void;
  onToggleTheme: () => void;
  onSignOut: () => void;
  onSwitchMode?: () => void;
}

export function MobilePerfilPage({
  user,
  role,
  displayName,
  avatarName,
  editing,
  editName,
  nameSuccess,
  editingEmail,
  newEmail,
  emailError,
  emailSuccess,
  editingPassword,
  currentPassword,
  newPassword,
  confirmPassword,
  passwordError,
  passwordSuccess,
  mode,
  editingAvatar,
  onEditName,
  onSetEditName,
  onSaveName,
  onCancelName,
  onSetAvatarName,
  onEditAvatar,
  onCancelAvatar,
  onSetEditingEmail,
  onSetNewEmail,
  onSaveEmail,
  onCancelEmail,
  onSetEditingPassword,
  onSetCurrentPassword,
  onSetNewPassword,
  onSetConfirmPassword,
  onSavePassword,
  onCancelPassword,
  onToggleTheme,
  onSignOut,
  onSwitchMode,
}: PerfilPageProps) {
  const Shell =
    role === "admin" ? AdminShell : role === "manager" ? ManagerShell : MobileShell;

  return (
    <Shell>
      <header className="mb-6">
        <h1 className="font-display text-xl text-[var(--clay-title)]">Perfil</h1>
      </header>

      <section className="mb-5 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Avatar name={avatarName} size={48} />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-base text-[var(--clay-title)]">{displayName}</h2>
            <p className="text-xs text-[var(--clay-title)]/60">
              {role === "admin"
                ? "Super-admin"
                : role === "manager"
                  ? "RH / Gestor"
                  : role === "dev"
                    ? "Desenvolvedor"
                    : "Colaborador"}
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--clay-title)]/40">{user?.email}</p>
          </div>
        </div>
      </section>

      <section className="mb-5 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
          Nome
        </h3>
        {editing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => onSetEditName(e.target.value)}
              placeholder="Novo nome"
              className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm text-[var(--clay-text)] outline-none shadow-sm placeholder:text-[var(--clay-title)]/40"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveName();
                if (e.key === "Escape") onCancelName();
              }}
            />
            {nameSuccess && <p className="text-xs text-green-600">{nameSuccess}</p>}
            <div className="flex gap-2">
              <button
                onClick={onSaveName}
                className="rounded-lg bg-[var(--clay-cta)] px-3 py-1 text-xs font-bold text-white shadow-sm"
              >
                Salvar
              </button>
              <button
                onClick={onCancelName}
                className="rounded-lg bg-white/50 px-3 py-1 text-xs text-[var(--clay-title)]/50 shadow-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onEditName}
            className="flex w-full items-center justify-between rounded-xl bg-white/50 p-3 shadow-sm active:translate-y-px"
          >
            <span className="flex items-center gap-2 text-sm text-[var(--clay-text)]">
              <Icon name="badge" className="text-sm" />
              {displayName}
            </span>
            <Icon name="edit" className="text-sm text-[var(--clay-title)]/50" />
          </button>
        )}
      </section>

      <section className="mb-5 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
          Avatar
        </h3>
        {editingAvatar ? (
          <div className="space-y-3">
            <div className="flex gap-3">
              {AVATAR_LIST.map((a) => (
                <button
                  key={a.name}
                  onClick={() => onSetAvatarName(a.name)}
                  className={`rounded-full transition-all ${avatarName === a.name ? "ring-2 ring-[var(--clay-cta)] ring-offset-2" : "ring-1 ring-transparent hover:ring-white/40"}`}
                >
                  <img
                    src={a.src}
                    alt={a.name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                    style={{ width: 48, height: 48 }}
                  />
                </button>
              ))}
            </div>
            <button
              onClick={onCancelAvatar}
              className="rounded-lg bg-white/50 px-3 py-1 text-xs text-[var(--clay-title)]/50 shadow-sm"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={onEditAvatar}
            className="flex w-full items-center justify-between rounded-xl bg-white/50 p-3 shadow-sm active:translate-y-px"
          >
            <div className="flex items-center gap-3">
              <Avatar name={avatarName} size={40} />
              <span className="text-sm text-[var(--clay-text)]">Clique para alterar</span>
            </div>
            <Icon name="edit" className="text-sm text-[var(--clay-title)]/50" />
          </button>
        )}
      </section>

      <section className="mb-5 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
          E-mail de Acesso
        </h3>
        <p className="mb-2 text-sm text-[var(--clay-text)]">{user?.email}</p>
        {editingEmail ? (
          <div className="space-y-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => onSetNewEmail(e.target.value)}
              placeholder="Novo e-mail"
              className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm text-[var(--clay-text)] outline-none shadow-sm placeholder:text-[var(--clay-title)]/40"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveEmail();
                if (e.key === "Escape") onCancelEmail();
              }}
            />
            {emailError && <p className="text-xs text-red-500">{emailError}</p>}
            {emailSuccess && <p className="text-xs text-green-600">{emailSuccess}</p>}
            <div className="flex gap-2">
              <button
                onClick={onSaveEmail}
                className="rounded-lg bg-[var(--clay-cta)] px-3 py-1 text-xs font-bold text-white shadow-sm"
              >
                Salvar
              </button>
              <button
                onClick={onCancelEmail}
                className="rounded-lg bg-white/50 px-3 py-1 text-xs text-[var(--clay-title)]/50 shadow-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onSetEditingEmail(true)}
            className="flex w-full items-center justify-between rounded-xl bg-white/50 p-3 shadow-sm active:translate-y-px"
          >
            <span className="flex items-center gap-2 text-sm text-[var(--clay-text)]">
              <Icon name="mail" className="text-sm" />
              Alterar e-mail
            </span>
            <Icon name="edit" className="text-sm text-[var(--clay-title)]/50" />
          </button>
        )}
      </section>

      <section className="mb-5 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
          Senha de Acesso
        </h3>
        {editingPassword ? (
          <div className="space-y-2">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => onSetCurrentPassword(e.target.value)}
              placeholder="Senha atual"
              className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm text-[var(--clay-text)] outline-none shadow-sm placeholder:text-[var(--clay-title)]/40"
              autoFocus
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => onSetNewPassword(e.target.value)}
              placeholder="Nova senha"
              className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm text-[var(--clay-text)] outline-none shadow-sm placeholder:text-[var(--clay-title)]/40"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => onSetConfirmPassword(e.target.value)}
              placeholder="Confirmar nova senha"
              className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm text-[var(--clay-text)] outline-none shadow-sm placeholder:text-[var(--clay-title)]/40"
              onKeyDown={(e) => {
                if (e.key === "Enter") onSavePassword();
                if (e.key === "Escape") onCancelPassword();
              }}
            />
            {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
            {passwordSuccess && <p className="text-xs text-green-600">{passwordSuccess}</p>}
            <div className="flex gap-2">
              <button
                onClick={onSavePassword}
                className="rounded-lg bg-[var(--clay-cta)] px-3 py-1 text-xs font-bold text-white shadow-sm"
              >
                Salvar
              </button>
              <button
                onClick={onCancelPassword}
                className="rounded-lg bg-white/50 px-3 py-1 text-xs text-[var(--clay-title)]/50 shadow-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onSetEditingPassword(true)}
            className="flex w-full items-center justify-between rounded-xl bg-white/50 p-3 shadow-sm active:translate-y-px"
          >
            <span className="flex items-center gap-2 text-sm text-[var(--clay-text)]">
              <Icon name="lock" className="text-sm" />
              Alterar senha
            </span>
            <Icon name="edit" className="text-sm text-[var(--clay-title)]/50" />
          </button>
        )}
      </section>

      {(role === "dev" || role === "admin") && onSwitchMode && (
        <section className="mb-5 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
            Modo de Acesso
          </h3>
          <button
            onClick={onSwitchMode}
            className="flex w-full items-center justify-between rounded-xl bg-white/50 p-3 shadow-sm active:translate-y-px"
          >
            <span className="flex items-center gap-2 text-sm text-[var(--clay-text)]">
              <Icon name="admin_panel_settings" className="text-sm" />
              {role === "admin" ? "Ir para Portal Admin" : "Alternar modo (Dev)"}
            </span>
            <Icon name="arrow_forward" className="text-sm text-[var(--clay-title)]/50" />
          </button>
        </section>
      )}

      <section className="mb-5 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
          Aparência
        </h3>
        <button
          onClick={onToggleTheme}
          className="flex w-full items-center justify-between rounded-xl bg-white/50 p-3 shadow-sm active:translate-y-px"
        >
          <span className="flex items-center gap-2 text-sm text-[var(--clay-text)]">
            <Icon name={mode === "light" ? "light_mode" : "dark_mode"} className="text-sm" />
            Modo {mode === "light" ? "Claro" : "Escuro"}
          </span>
          <span className="text-[10px] text-[var(--clay-title)]/50">Tocar</span>
        </button>
      </section>

      {user && (
        <section className="mb-5 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
            Conta
          </h3>
          <button
            onClick={onSignOut}
            className="flex w-full items-center justify-between rounded-xl bg-white/50 p-3 shadow-sm active:translate-y-px"
          >
            <span className="flex items-center gap-2 text-sm text-[var(--clay-text)]">
              <Icon name="logout" className="text-sm" />
              Sair
            </span>
          </button>
        </section>
      )}
    </Shell>
  );
}
