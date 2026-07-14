import { DesktopShell } from "@/components/DesktopShell";
import { ManagerShell } from "@/components/ManagerShell";
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

export function DesktopPerfilPage({
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
  const Shell = role === "manager" ? ManagerShell : DesktopShell;

  return (
    <Shell>
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <h1 className="font-display text-2xl text-[var(--clay-title)]">Perfil</h1>
        </header>

        <div className="mb-6 flex items-center gap-4 rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
          <Avatar name={avatarName} size={64} />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl text-[var(--clay-title)]">{displayName}</h2>
            <p className="text-sm text-[var(--clay-title)]/60">
              {role === "manager"
                ? "RH / Gestor"
                : role === "dev"
                  ? "Desenvolvedor"
                  : "Colaborador"}
            </p>
            <p className="text-xs text-[var(--clay-title)]/40">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
              Nome
            </h3>
            {editing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => onSetEditName(e.target.value)}
                  placeholder="Novo nome"
                  className="w-full rounded-xl bg-white/70 px-4 py-2.5 text-sm text-[var(--clay-text)] outline-none shadow-sm placeholder:text-[var(--clay-title)]/40"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSaveName();
                    if (e.key === "Escape") onCancelName();
                  }}
                />
                {nameSuccess && <p className="text-sm text-green-600">{nameSuccess}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={onSaveName}
                    className="rounded-lg bg-[var(--clay-cta)] px-4 py-1.5 text-sm font-bold text-white shadow-sm"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={onCancelName}
                    className="rounded-lg bg-white/50 px-4 py-1.5 text-sm text-[var(--clay-title)]/50 shadow-sm hover:bg-white/70"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onEditName}
                className="flex w-full items-center justify-between rounded-xl bg-white/50 p-3 shadow-sm hover:bg-white/70"
              >
                <span className="flex items-center gap-2 text-sm text-[var(--clay-text)]">
                  <Icon name="badge" className="text-base" />
                  {displayName}
                </span>
                <Icon name="edit" className="text-base text-[var(--clay-title)]/50" />
              </button>
            )}
          </section>

          <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
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
                        width={56}
                        height={56}
                        className="rounded-full object-cover"
                        style={{ width: 56, height: 56 }}
                      />
                    </button>
                  ))}
                </div>
                <button
                  onClick={onCancelAvatar}
                  className="rounded-lg bg-white/50 px-4 py-1.5 text-sm text-[var(--clay-title)]/50 shadow-sm hover:bg-white/70"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={onEditAvatar}
                className="flex w-full items-center justify-between rounded-xl bg-white/50 p-3 shadow-sm hover:bg-white/70"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={avatarName} size={48} />
                  <span className="text-sm text-[var(--clay-text)]">Clique para alterar</span>
                </div>
                <Icon name="edit" className="text-base text-[var(--clay-title)]/50" />
              </button>
            )}
          </section>

          <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
              E-mail de Acesso
            </h3>
            <p className="mb-3 text-sm text-[var(--clay-text)]">{user?.email}</p>
            {editingEmail ? (
              <div className="space-y-3">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => onSetNewEmail(e.target.value)}
                  placeholder="Novo e-mail"
                  className="w-full rounded-xl bg-white/70 px-4 py-2.5 text-sm text-[var(--clay-text)] outline-none shadow-sm placeholder:text-[var(--clay-title)]/40"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSaveEmail();
                    if (e.key === "Escape") onCancelEmail();
                  }}
                />
                {emailError && <p className="text-sm text-red-500">{emailError}</p>}
                {emailSuccess && <p className="text-sm text-green-600">{emailSuccess}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={onSaveEmail}
                    className="rounded-lg bg-[var(--clay-cta)] px-4 py-1.5 text-sm font-bold text-white shadow-sm"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={onCancelEmail}
                    className="rounded-lg bg-white/50 px-4 py-1.5 text-sm text-[var(--clay-title)]/50 shadow-sm hover:bg-white/70"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => onSetEditingEmail(true)}
                className="flex w-full items-center justify-between rounded-xl bg-white/50 p-3 shadow-sm hover:bg-white/70"
              >
                <span className="flex items-center gap-2 text-sm text-[var(--clay-text)]">
                  <Icon name="mail" className="text-base" />
                  Alterar e-mail
                </span>
                <Icon name="edit" className="text-base text-[var(--clay-title)]/50" />
              </button>
            )}
          </section>

          <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
              Senha de Acesso
            </h3>
            {editingPassword ? (
              <div className="space-y-3">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => onSetCurrentPassword(e.target.value)}
                  placeholder="Senha atual"
                  className="w-full rounded-xl bg-white/70 px-4 py-2.5 text-sm text-[var(--clay-text)] outline-none shadow-sm placeholder:text-[var(--clay-title)]/40"
                  autoFocus
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => onSetNewPassword(e.target.value)}
                  placeholder="Nova senha"
                  className="w-full rounded-xl bg-white/70 px-4 py-2.5 text-sm text-[var(--clay-text)] outline-none shadow-sm placeholder:text-[var(--clay-title)]/40"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => onSetConfirmPassword(e.target.value)}
                  placeholder="Confirmar nova senha"
                  className="w-full rounded-xl bg-white/70 px-4 py-2.5 text-sm text-[var(--clay-text)] outline-none shadow-sm placeholder:text-[var(--clay-title)]/40"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSavePassword();
                    if (e.key === "Escape") onCancelPassword();
                  }}
                />
                {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
                {passwordSuccess && <p className="text-sm text-green-600">{passwordSuccess}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={onSavePassword}
                    className="rounded-lg bg-[var(--clay-cta)] px-4 py-1.5 text-sm font-bold text-white shadow-sm"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={onCancelPassword}
                    className="rounded-lg bg-white/50 px-4 py-1.5 text-sm text-[var(--clay-title)]/50 shadow-sm hover:bg-white/70"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => onSetEditingPassword(true)}
                className="flex w-full items-center justify-between rounded-xl bg-white/50 p-3 shadow-sm hover:bg-white/70"
              >
                <span className="flex items-center gap-2 text-sm text-[var(--clay-text)]">
                  <Icon name="lock" className="text-base" />
                  Alterar senha
                </span>
                <Icon name="edit" className="text-base text-[var(--clay-title)]/50" />
              </button>
            )}
          </section>

          <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
              Aparência
            </h3>
            <button
              onClick={onToggleTheme}
              className="flex w-full items-center justify-between rounded-xl bg-white/50 p-3 shadow-sm hover:bg-white/70"
            >
              <span className="flex items-center gap-2 text-sm text-[var(--clay-text)]">
                <Icon name={mode === "light" ? "light_mode" : "dark_mode"} className="text-base" />
                Modo {mode === "light" ? "Claro" : "Escuro"}
              </span>
              <span className="text-xs text-[var(--clay-title)]/50">Clique para alternar</span>
            </button>
          </section>

          <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
              Conta
            </h3>
            <button
              onClick={onSignOut}
              className="flex w-full items-center justify-between rounded-xl bg-white/50 p-3 shadow-sm hover:bg-white/70"
            >
              <span className="flex items-center gap-2 text-sm text-[var(--clay-text)]">
                <Icon name="logout" className="text-base" />
                Sair
              </span>
            </button>
          </section>

          {role === "dev" && onSwitchMode && (
            <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md lg:col-span-2">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
                Modo de Acesso
              </h3>
              <button
                onClick={onSwitchMode}
                className="flex w-full items-center justify-between rounded-xl bg-white/50 p-3 shadow-sm hover:bg-white/70"
              >
                <span className="flex items-center gap-2 text-sm text-[var(--clay-text)]">
                  <Icon name="business" className="text-base" />
                  Ir para Painel RH
                </span>
                <Icon name="arrow_forward" className="text-base text-[var(--clay-title)]/50" />
              </button>
            </section>
          )}
        </div>
      </div>
    </Shell>
  );
}
