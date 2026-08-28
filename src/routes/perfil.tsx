import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme";
import { useRequireAuth } from "@/lib/use-require-auth";
import { PageLoader } from "@/components/ClayLoader";
import { MobilePerfilPage } from "@/components/pages/mobile/PerfilPage";
import { DesktopPerfilPage } from "@/components/pages/desktop/PerfilPage";
import { ResponsivePages } from "@/components/pages/ResponsivePages";
import { getProfile, updateProfile, updateEmail, updatePassword } from "@/lib/api/auth.server";
import { withdrawPrivacyConsent, deleteMyAccount } from "@/lib/api/privacy.server";
import { PrivacyPreferencesSection } from "@/components/PrivacyPreferencesSection";
import { CrisisHelp } from "@/components/CrisisHelp";

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
  const [jobTitle, setJobTitle] = useState("");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");
  const [editingJobTitle, setEditingJobTitle] = useState(false);
  const [editJobTitle, setEditJobTitle] = useState("");
  const [jobTitleSuccess, setJobTitleSuccess] = useState("");

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

  useEffect(() => {
    if (!session || profileLoaded) return;
    (async () => {
      const profile = await getProfile();
      if (profile && "display_name" in profile) {
        const p = profile as {
          display_name: string;
          avatar_url?: string;
          job_title?: string | null;
        };
        setDisplayName(p.display_name);
        setJobTitle(p.job_title?.trim() ?? "");
        if (p.avatar_url) setAvatarName(p.avatar_url);
      } else {
        setDisplayName(user?.email?.split("@")[0] ?? "Usuário");
      }
      setProfileLoaded(true);
    })();
  }, [session, user, profileLoaded]);

  if (loading || !isAuthorized) {
    return (
      <PageLoader />
    );
  }

  const switchMode = () => {
    if (role === "dev") {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith("/dashiadmin")) {
        navigate({ to: "/dashitecnology", replace: true });
      } else if (currentPath.startsWith("/dashitecnology")) {
        navigate({ to: "/", replace: true });
      } else if (currentPath.startsWith("/manager")) {
        navigate({ to: "/dashiadmin", replace: true });
      } else {
        navigate({ to: "/manager", replace: true });
      }
    } else if (role === "admin") {
      navigate({ to: "/dashiadmin", replace: true });
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

  const handleSaveJobTitle = async () => {
    setJobTitleSuccess("");
    if (!session) return;
    const next = editJobTitle.trim();
    const { error } = await updateProfile({ data: { jobTitle: next } });
    if (!error) {
      setJobTitle(next);
      setEditingJobTitle(false);
      setJobTitleSuccess("Cargo atualizado");
      setTimeout(() => setJobTitleSuccess(""), 2000);
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
    jobTitle,
    avatarName,
    editing,
    editName,
    nameSuccess,
    editingJobTitle,
    editJobTitle,
    jobTitleSuccess,
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
    onEditJobTitle: () => {
      setEditJobTitle(jobTitle);
      setEditingJobTitle(true);
    },
    onSetEditJobTitle: setEditJobTitle,
    onSaveJobTitle: handleSaveJobTitle,
    onCancelJobTitle: () => {
      setEditingJobTitle(false);
      setJobTitleSuccess("");
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
        <PrivacyPreferencesSection
          onWithdraw={async () => {
            if (!session) return;
            if (!window.confirm("Revogar o consentimento? Você será levado ao termo de novo.")) return;
            const result = await withdrawPrivacyConsent();
            if (!result.error) navigate({ to: "/onboarding", replace: true });
          }}
          onDeleteAccount={async () => {
            if (!session) return;
            if (!window.confirm("Excluir sua conta e dados? Esta ação não pode ser desfeita.")) return;
            const result = await deleteMyAccount();
            if (!result.error) await signOut();
          }}
        />
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
