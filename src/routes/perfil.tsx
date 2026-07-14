import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme";
import { useRequireAuth } from "@/lib/use-require-auth";
import { Icon } from "@/components/Icon";
import { MobilePerfilPage } from "@/components/pages/mobile/PerfilPage";
import { DesktopPerfilPage } from "@/components/pages/desktop/PerfilPage";
import { getProfile, updateProfile, updateEmail, updatePassword } from "@/lib/api/auth.server";

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

  const switchMode = () => {
    if (role === "dev") {
      // Dev pode escolher entre as 3 views
      const currentPath = window.location.pathname;
      if (currentPath.startsWith("/dashitecnology")) {
        navigate({ to: "/", replace: true });
      } else if (currentPath.startsWith("/manager")) {
        navigate({ to: "/dashitecnology", replace: true });
      } else {
        navigate({ to: "/manager", replace: true });
      }
    } else {
      // Manager e companion apenas trocam entre suas views
      const target = role === "manager" ? "/" : "/manager";
      navigate({ to: target, replace: true });
    }
  };

  const handleSaveName = async () => {
    setNameSuccess("");
    if (!session?.access_token || !editName.trim()) return;
    const { error } = await updateProfile({
      data: { accessToken: session.access_token, displayName: editName.trim() },
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
      if (session?.access_token) {
        await updateProfile({ data: { accessToken: session.access_token, avatarUrl: name } });
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
  };

  return (
    <>
      <div className="block md:hidden">
        <MobilePerfilPage {...props} />
      </div>
      <div className="hidden md:block">
        <DesktopPerfilPage {...props} />
      </div>
    </>
  );
}
