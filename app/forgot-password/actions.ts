"use server";

import { headers } from "next/headers";
import { forgotSchema } from "@/lib/schemas";
import { supabaseServer } from "@/lib/supabase/server";
import { allowRequest } from "@/lib/ratelimit";

export type ForgotState = { done?: boolean; error?: string };

// Always the same reply — never reveal whether an account exists.
const DONE: ForgotState = { done: true };

export async function requestReset(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const parsed = forgotSchema.safeParse({
    email: formData.get("email"),
    website: formData.get("website") ?? "",
  });
  if (!parsed.success) return { error: "Please enter a valid email address." };

  // honeypot — pretend success
  if (parsed.data.website !== "") return DONE;

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const allowed = await allowRequest(`reset:ip:${ip}`, 3, 3600);
  if (!allowed) {
    return { error: "Too many requests. Please try again in an hour." };
  }

  const supabase = await supabaseServer();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });

  return DONE;
}
