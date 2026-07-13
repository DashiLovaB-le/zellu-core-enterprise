import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme";
import { useRequireAuth } from "@/lib/use-require-auth";
import { MobileShell } from "@/components/MobileShell";
import { ManagerShell } from "@/components/ManagerShell";
import { Avatar, AVATAR_LIST } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import {
  getProfile,
  updateProfile,
  updateEmail,
  updatePassword,
} from "@/lib/api/auth.server";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [{ title: "Perfil" }, { name: "description", content: "Seu perfil e configurações." }],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  const { user, signOut, role } = useAuth();
  const { mode, toggle } = useTheme();
  const { isAuthorized, loading } = useRequireAuth();
  const navigate = useNavigate();
  const session = useAuth().session;

  const [displayName, setDisplayName] = useState("");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");

  const [avatarName, setAvatarName] = useState("");

  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");

  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    if (!session?.access_token || profileLoaded) return;
    (async () => {
      const profile = await getProfile({ data: { accessToken: session.access_token! } });
      if (profile && "display_name" in profile) {
        const p = profile as { display_name: string; avatar_url?: string };
        setDisplayName(p.display_name);
        if (p.avatar_url) setAvatarName(p.avatar_url);
      } else {
        setDisplayName(user?.email?.split("@")[0] ?? "Usuário");
      }
      setProfileLoaded(true);
    })();
  }, [session, user, profileLoaded]);

  if (loading || !isAuthorized) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Icon name="sync" className="animate-spin text-3xl text-[var(--clay-title)]" />
      </div>
    );
  }

  const Shell = role === "manager" ? ManagerShell : MobileShell;

  const switchMode = () => {
    const target = role === "manager" ? "/" : "/manager";
    navigate({ to: target, replace: true });
  };

  const handleSaveName = async () => {
    setNameSuccess("");
    if (!session?.access_token || !editName.trim()) return;
    const { error } = await updateProfile({
      data: { accessToken: session.access_token, displayName: editName.trim() },
    });
    if (error) {
      setNameSuccess("");
    } else {
      setDisplayName(editName.trim());
      setEditing(false);
      setNameSuccess("Nome atualizado");
      setTimeout(() => setNameSuccess(""), 2000);
    }
  };

  const handleSaveEmail = async () => {
    setEmailError("");
    setEmailSuccess("");
    if (!session?.access_token || !newEmail.trim()) return;
    const { error } = await updateEmail({
      data: { accessToken: session.access_token, email: newEmail.trim() },
    });
    if (error) {
      setEmailError(error);
    } else {
      setEmailSuccess("E-mail de confirmação enviado para o novo endereço");
      setEditingEmail(false);
      setNewEmail("");
    }
  };

  const handleSavePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");
    if (!session?.access_token || !user?.email) return;
    if (newPassword !== confirmPassword) {
      setPasswordError("Nova senha e confirmação não coincidem");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Nova senha deve ter no mínimo 6 caracteres");
      return;
    }
    const { error } = await updatePassword({
      data: {
        accessToken: session.access_token,
        email: user.email,
        currentPassword,
        newPassword,
      },
    });
    if (error) {
      setPasswordError(error);
    } else {
      setPasswordSuccess("Senha alterada com sucesso");
      setEditingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(""), 3000);
    }
  };

  return (
    <Shell>
      <header className="mb-6">
        <h1 className="font-display text-xl text-[var(--clay-title)]">Perfil</h1>
      </header>

      <section className="mb-5 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Avatar name={avatarName} size={48} />
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-base text-[var(--clay-title)]">{displayName}</h2>
            <p className="text-xs text-[var(--clay-title)]/60">
              {role === "manager" ? "RH / Gestor" : role === "dev" ? "Desenvolvedor" : "Colaborador"}
            </p>
            <p className="text-[10px] text-[var(--clay-title)]/40 mt-0.5">{user?.email}</p>
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
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Novo nome"
              className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm text-[var(--clay-text)] outline-none shadow-sm placeholder:text-[var(--clay-title)]/40"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName();
                if (e.key === "Escape") { setEditing(false); setNameSuccess(""); }
              }}
            />
            {nameSuccess && <p className="text-xs text-green-600">{nameSuccess}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleSaveName}
                className="rounded-lg bg-[var(--clay-cta)] px-3 py-1 text-xs font-bold text-white shadow-sm"
              >
                Salvar
              </button>
              <button
                onClick={() => { setEditing(false); setNameSuccess(""); }}
                className="rounded-lg bg-white/50 px-3 py-1 text-xs text-[var(--clay-title)]/50 shadow-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { setEditName(displayName); setEditing(true); }}
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
        <div className="flex gap-3">
          {AVATAR_LIST.map((a) => (
            <button
              key={a.name}
              onClick={async () => {
                setAvatarName(a.name);
                if (session?.access_token) {
                  await updateProfile({
                    data: { accessToken: session.access_token, avatarUrl: a.name },
                  });
                }
              }}
              className={`rounded-full transition-all ${
                avatarName === a.name
                  ? "ring-2 ring-[var(--clay-cta)] ring-offset-2"
                  : "ring-1 ring-transparent hover:ring-white/40"
              }`}
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
      </section>

      <section className="mb-5 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
          E-mail de Acesso
        </h3>
        <p className="mb-2 text-sm text-[var(--clay-text)]">
          {user?.email}
        </p>
        {editingEmail ? (
          <div className="space-y-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Novo e-mail"
              className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm text-[var(--clay-text)] outline-none shadow-sm placeholder:text-[var(--clay-title)]/40"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEmail();
                if (e.key === "Escape") { setEditingEmail(false); setEmailError(""); }
              }}
            />
            {emailError && <p className="text-xs text-red-500">{emailError}</p>}
            {emailSuccess && <p className="text-xs text-green-600">{emailSuccess}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleSaveEmail}
                className="rounded-lg bg-[var(--clay-cta)] px-3 py-1 text-xs font-bold text-white shadow-sm"
              >
                Salvar
              </button>
              <button
                onClick={() => { setEditingEmail(false); setEmailError(""); setEmailSuccess(""); }}
                className="rounded-lg bg-white/50 px-3 py-1 text-xs text-[var(--clay-title)]/50 shadow-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditingEmail(true)}
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
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Senha atual"
              className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm text-[var(--clay-text)] outline-none shadow-sm placeholder:text-[var(--clay-title)]/40"
              autoFocus
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nova senha"
              className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm text-[var(--clay-text)] outline-none shadow-sm placeholder:text-[var(--clay-title)]/40"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar nova senha"
              className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm text-[var(--clay-text)] outline-none shadow-sm placeholder:text-[var(--clay-title)]/40"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSavePassword();
                if (e.key === "Escape") { setEditingPassword(false); setPasswordError(""); }
              }}
            />
            {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
            {passwordSuccess && <p className="text-xs text-green-600">{passwordSuccess}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleSavePassword}
                className="rounded-lg bg-[var(--clay-cta)] px-3 py-1 text-xs font-bold text-white shadow-sm"
              >
                Salvar
              </button>
              <button
                onClick={() => { setEditingPassword(false); setPasswordError(""); setPasswordSuccess(""); }}
                className="rounded-lg bg-white/50 px-3 py-1 text-xs text-[var(--clay-title)]/50 shadow-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditingPassword(true)}
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

      {role === "dev" && (
        <section className="mb-5 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
            Modo de Acesso
          </h3>
          <button
            onClick={switchMode}
            className="flex w-full items-center justify-between rounded-xl bg-white/50 p-3 shadow-sm active:translate-y-px"
          >
            <span className="flex items-center gap-2 text-sm text-[var(--clay-text)]">
              <Icon name={role === "manager" ? "person" : "business"} className="text-sm" />
              {role === "manager" ? "Ir para Companion" : "Ir para Painel RH"}
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
          onClick={toggle}
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
            onClick={() => signOut()}
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
