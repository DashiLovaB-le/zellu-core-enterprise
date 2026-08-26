type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendEmailResult =
  | { sent: true; error: null }
  | { sent: false; error: string | null; skipped: boolean };

function fromAddress(): string {
  return (
    process.env.INVITE_FROM_EMAIL ??
    process.env.REMINDER_FROM_EMAIL ??
    "Zēllu <noreply@zellu.app>"
  );
}

/** Dispara e-mail transacional via Resend. Sem API key, retorna skipped. */
export async function sendTransactionalEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return { sent: false, error: null, skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { sent: false, error: body || `Resend HTTP ${res.status}`, skipped: false };
    }

    return { sent: true, error: null };
  } catch (err) {
    return { sent: false, error: String(err), skipped: false };
  }
}

const ROLE_LABEL: Record<string, string> = {
  companion: "Colaborador",
  manager: "RH",
};

export async function sendInviteEmail(input: {
  to: string;
  inviteUrl: string;
  companyName: string;
  role: string;
  expiresAt: string;
}): Promise<SendEmailResult> {
  const roleLabel = ROLE_LABEL[input.role] ?? input.role;
  const expires = new Date(input.expiresAt).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const subject = `Convite para o Zēllu — ${input.companyName}`;
  const text = [
    `Você foi convidado(a) para acessar o Zēllu como ${roleLabel} em ${input.companyName}.`,
    "",
    "Para criar sua conta e entrar, abra o link abaixo:",
    input.inviteUrl,
    "",
    `Este convite expira em ${expires}.`,
    "",
    "Se você não esperava este e-mail, pode ignorá-lo com segurança.",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#F3EEE1;font-family:Nunito Sans,Segoe UI,sans-serif;color:#3D4A5C;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F3EEE1;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:#ffffff;border-radius:20px;padding:32px 28px;box-shadow:0 8px 24px rgba(74,106,138,0.1);">
          <tr>
            <td style="font-family:Quicksand,Segoe UI,sans-serif;font-size:22px;font-weight:600;color:#4A6A8A;padding-bottom:8px;">
              Zēllu
            </td>
          </tr>
          <tr>
            <td style="font-size:15px;line-height:1.6;padding-bottom:20px;">
              Você foi convidado(a) para acessar como <strong>${roleLabel}</strong> em
              <strong>${input.companyName}</strong>.
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <a href="${input.inviteUrl}" style="display:inline-block;background:linear-gradient(135deg,#99BEE5,#C5D9F1);color:#253654;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:999px;font-size:15px;">
                Criar conta e entrar
              </a>
            </td>
          </tr>
          <tr>
            <td style="font-size:13px;line-height:1.5;color:#4A6A8A;padding-bottom:16px;">
              Ou copie este link no navegador:<br/>
              <a href="${input.inviteUrl}" style="color:#4A6A8A;word-break:break-all;">${input.inviteUrl}</a>
            </td>
          </tr>
          <tr>
            <td style="font-size:12px;line-height:1.5;color:#8A96A3;">
              Convite válido até ${expires}. Se não esperava este e-mail, ignore com segurança.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendTransactionalEmail({ to: input.to, subject, text, html });
}
