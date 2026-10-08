"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { loginSchema } from "@/lib/schemas";
import { supabaseServer } from "@/lib/supabase/server";
import { allowRequest } from "@/lib/ratelimit";
import {
  isOwnerEmail,
  SESS_START_COOKIE,
  LAST_SEEN_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";

export type AuthFormState = { error?: string };

const GENERIC = "Incorrect email or password.";

export async function signIn(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: GENERIC };
  const { email, password } = parsed.data;

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const [ipOk, emailOk] = await Promise.all([
    allowRequest(`login:ip:${ip}`, 5, 900),
    allowRequest(`login:em:${email.toLowerCase()}`, 5, 900),
  ]);
  if (!ipOk || !emailOk) {
    return { error: "Too many attempts. Please wait 15 minutes and try again." };
  }

  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: GENERIC };

  if (!isOwnerEmail(data.user.email)) {
    await supabase.auth.signOut();
    return { error: GENERIC };
  }

  const jar = await cookies();
  const now = String(Date.now());
  jar.set(SESS_START_COOKIE, now, sessionCookieOptions);
  jar.set(LAST_SEEN_COOKIE, now, sessionCookieOptions);

  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  const jar = await cookies();
  jar.delete(SESS_START_COOKIE);
  jar.delete(LAST_SEEN_COOKIE);
  redirect("/login");
}
