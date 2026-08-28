import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sendTransactionalEmail } from "@/lib/email.server";

const LeadInput = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(80),
  email: z.string().trim().email("Informe um e-mail válido."),
  company: z.string().trim().min(2, "Informe a empresa.").max(120),
  website: z.string().max(200).optional(),
});

export type SubmitLandingLeadResult =
  | { ok: true; delivered: boolean }
  | { ok: false; error: string };

function leadsInbox(): string {
  const to = process.env.LEADS_TO_EMAIL?.trim();
  return to && to.length > 3 ? to : "privacidade@zellu.app";
}

export const submitLandingLead = createServerFn({ method: "POST" })
  .inputValidator(LeadInput)
  .handler(async ({ data }): Promise<SubmitLandingLeadResult> => {
    if (data.website && data.website.trim().length > 0) {
      return { ok: true, delivered: true };
    }

    const to = leadsInbox();

    const result = await sendTransactionalEmail({
      to,
      subject: `Zēllu · pedido de teste — ${data.company}`,
      text: [
        "Pedido de teste (landing / validação RH)",
        "",
        `Nome: ${data.name}`,
        `E-mail: ${data.email}`,
        `Empresa: ${data.company}`,
      ].join("\n"),
      html: `
        <p>Pedido de teste (landing / validação RH)</p>
        <p><strong>Nome:</strong> ${escapeHtml(data.name)}<br/>
        <strong>E-mail:</strong> ${escapeHtml(data.email)}<br/>
        <strong>Empresa:</strong> ${escapeHtml(data.company)}</p>
      `,
    });

    if (result.skipped) {
      return {
        ok: false,
        error: "O envio de e-mail está desligado neste ambiente. Escreva para privacidade@zellu.app.",
      };
    }
    if (!result.sent) {
      return { ok: false, error: "Não foi possível enviar agora. Tente de novo em instantes." };
    }
    return { ok: true, delivered: true };
  });

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
