import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme";
import { useRequireAuth } from "@/lib/use-require-auth";
import { Icon } from "@/components/Icon";
import { MobilePerfilPage } from "@/components/pages/mobile/PerfilPage";
import { DesktopPerfilPage } from "@/components/pages/desktop/PerfilPage";
import { ResponsivePages } from "@/components/pages/ResponsivePages";
import { getProfile, updateProfile, updateEmail, updatePassword } from "@/lib/api/auth.server";
import { exportMyData, deleteMyAccount, updatePrivacyPreferences, withdrawPrivacyConsent } from "@/lib/api/privacy.server";
import { CrisisHelp } from "@/components/CrisisHelp";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [{ title: "Perfil" }, { name: "description", content: "Seu perfil e configurações." }],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  const { user, signOut, role, setAvatarUrl } = useAuth();
  const { mode, toggle } = useTheme();
  const { isAuthorized, loading } = useRequireAuth();
  const navigate = useNavigate();
  const session = useAuth().session;

  const [displayName, setDisplayName] = useState("");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");

  const [avatarName, setAvatarName] = useState("");
  const [editingAvatar, setEditingAvatar] = useState(false);

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
  const [aiOptIn, setAiOptIn] = useState(false);
  const [rhOptIn, setRhOptIn] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(false);

  useEffect(() => {
    if (!session || profileLoaded) return;
    (async () => {
      const profile = await getProfile();
      if (profile && "display_name" in profile) {
        const p = profile as {
          display_name: string;
          avatar_url?: string;
          privacy_ai_opt_in?: boolean;
          privacy_rh_opt_in?: boolean;
          privacy_email_opt_in?: boolean;
        };
        setDisplayName(p.display_name);
        if (p.avatar_url) setAvatarName(p.avatar_url);
        setAiOptIn(Boolean(p.privacy_ai_opt_in));
        setRhOptIn(Boolean(p.privacy_rh_opt_in));
        setEmailOptIn(Boolean(p.privacy_email_opt_in));
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

  const switchMode = () => {
    if (role === "dev") {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith("/admin")) {
        navigate({ to: "/dashitecnology", replace: true });
      } else if (currentPath.startsWith("/dashitecnology")) {
        navigate({ to: "/", replace: true });
      } else if (currentPath.startsWith("/manager")) {
        navigate({ to: "/admin", replace: true });
      } else {
        navigate({ to: "/manager", replace: true });
      }
    } else if (role === "admin") {
      navigate({ to: "/admin", replace: true });
    } else {
      const target = role === "manager" ? "/" : "/manager";
      navigate({ to: target, replace: true });
    }
  };

  const handleSaveName = async () => {
    setNameSuccess("");
    if (!session || !editName.trim()) return;
    const { error } = await updateProfile({ data: { displayName: editName.trim() },
    });
    if (!error) {
      setDisplayName(editName.trim());
      setEditing(false);
      setNameSuccess("Nome atualizado");
      setTimeout(() => setNameSuccess(""), 2000);
    }
  };

  const handleSaveEmail = async () => {
    setEmailError("");
    setEmailSuccess("");
    if (!session || !newEmail.trim()) return;
    const { error } = await updateEmail({ data: { email: newEmail.trim() },
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
    if (!session || !user?.email) return;
    if (newPassword !== confirmPassword) {
      setPasswordError("Nova senha e confirmação não coincidem");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Nova senha deve ter no mínimo 8 caracteres");
      return;
    }
    const { error } = await updatePassword({ data: { email: user.email,
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

  const props = {
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
    onEditName: () => {
      setEditName(displayName);
      setEditing(true);
    },
    onSetEditName: setEditName,
    onSaveName: handleSaveName,
    onCancelName: () => {
      setEditing(false);
      setNameSuccess("");
    },
    onSetAvatarName: async (name: string) => {
      setAvatarName(name);
      setEditingAvatar(false);
      if (session) {
        await updateProfile({ data: { avatarUrl: name } });
        await setAvatarUrl(name);
      }
    },
    editingAvatar,
    onEditAvatar: () => setEditingAvatar(true),
    onCancelAvatar: () => setEditingAvatar(false),
    onSetEditingEmail: setEditingEmail,
    onSetNewEmail: setNewEmail,
    onSaveEmail: handleSaveEmail,
    onCancelEmail: () => {
      setEditingEmail(false);
      setEmailError("");
      setEmailSuccess("");
    },
    onSetEditingPassword: setEditingPassword,
    onSetCurrentPassword: setCurrentPassword,
    onSetNewPassword: setNewPassword,
    onSetConfirmPassword: setConfirmPassword,
    onSavePassword: handleSavePassword,
    onCancelPassword: () => {
      setEditingPassword(false);
      setPasswordError("");
      setPasswordSuccess("");
    },
    onToggleTheme: toggle,
    onSignOut: signOut,
    onSwitchMode: role ? switchMode : undefined,
    extraSections: (
      <div className="mb-5 space-y-4">
        <CrisisHelp />
        <section className="rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
            Seus dados (LGPD)
          </h3>
          <p className="mb-3 text-xs text-[var(--clay-text)]/70">
            <Link to="/privacidade" className="underline">
              Política de privacidade
            </Link>
          </p>
          <label className="mb-2 flex items-center justify-between gap-2 text-sm">
            <span>IA na nuvem (OpenRouter)</span>
            <input
              type="checkbox"
              checked={aiOptIn}
              onChange={async (e) => {
                const next = e.target.checked;
                setAiOptIn(next);
                if (session) {
                  await updatePrivacyPreferences({ data: { aiOptIn: next } });
                }
              }}
            />
          </label>
          <label className="mb-2 flex items-center justify-between gap-2 text-sm">
            <span>Indicadores agregados no RH</span>
            <input
              type="checkbox"
              checked={rhOptIn}
              onChange={async (e) => {
                const next = e.target.checked;
                setRhOptIn(next);
                if (session) {
                  await updatePrivacyPreferences({ data: { rhOptIn: next } });
                }
              }}
            />
          </label>
          <label className="mb-3 flex items-center justify-between gap-2 text-sm">
            <span>E-mail de lembrete</span>
            <input
              type="checkbox"
              checked={emailOptIn}
              onChange={async (e) => {
                const next = e.target.checked;
                setEmailOptIn(next);
                if (session) {
                  await updatePrivacyPreferences({ data: { emailOptIn: next } });
                }
              }}
            />
          </label>
          <button
            type="button"
            className="mb-2 w-full rounded-xl bg-white/50 p-3 text-left text-sm"
            onClick={async () => {
              if (!session) return;
              const result = await exportMyData();
              if (!result.data) return;
              const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "mundo-mental-meus-dados.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Exportar meus dados
          </button>
          <button
            type="button"
            className="mb-2 w-full rounded-xl bg-white/50 p-3 text-left text-sm"
            onClick={async () => {
              if (!session) return;
              if (!window.confirm("Revogar o consentimento? Você será levado ao termo de novo.")) return;
              const result = await withdrawPrivacyConsent();
              if (!result.error) navigate({ to: "/onboarding", replace: true });
            }}
          >
            Revogar consentimento
          </button>
          <button
            type="button"
            className="w-full rounded-xl bg-white/50 p-3 text-left text-sm text-red-700"
            onClick={async () => {
              if (!session) return;
              if (!window.confirm("Excluir sua conta e dados? Esta ação não pode ser desfeita.")) return;
              const result = await deleteMyAccount();
              if (!result.error) await signOut();
            }}
          >
            Excluir conta
          </button>
        </section>
      </div>
    ),
  };

  return (
    <ResponsivePages
      mobile={<MobilePerfilPage {...props} />}
      desktop={<DesktopPerfilPage {...props} />}
    />
  );
}
