"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { OWNER_EMAIL, SESS_START_COOKIE, LAST_SEEN_COOKIE } from "@/lib/auth";

export type ResetState = { error?: string };

const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(200);

export async function updatePassword(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  if (formData.get("password") !== formData.get("confirm")) {
    return { error: "Passwords don't match." };
  }

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== OWNER_EMAIL) {
    return { error: "Your reset link expired. Please request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) {
    return {
      error:
        error.message === "New password should be different from the old password."
          ? "New password must be different from the old one."
          : "Couldn't update the password. Please request a new link.",
    };
  }

  // end the recovery session; owner signs in fresh with the new password
  await supabase.auth.signOut();
  const jar = await cookies();
  jar.delete(SESS_START_COOKIE);
  jar.delete(LAST_SEEN_COOKIE);
  redirect("/login?reset=1");
}
