import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const confirmUser = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data }: { data: { userId: string } }) => {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(data.userId, {
      email_confirm: true,
    });
    return { error: error?.message ?? null };
  });
