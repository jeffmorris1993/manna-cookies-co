import "server-only";
import { supabaseServer } from "./supabase/server";

export const OWNER_EMAIL = "hello@sirromstudios.com";

/** Session policy (user-selected): 24h idle timeout + 7-day absolute cap. */
export const SESSION_ABSOLUTE_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_IDLE_MS = 24 * 60 * 60 * 1000;
export const SESS_START_COOKIE = "mc_sess_start";
export const LAST_SEEN_COOKIE = "mc_last_seen";

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_ABSOLUTE_MS / 1000,
};

/**
 * The real gate for every dashboard read and mutation. Middleware is only a
 * convenience redirect — never trust it alone.
 * Returns the authed Supabase client, or throws.
 */
export async function requireOwner() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== OWNER_EMAIL) {
    throw new Error("UNAUTHORIZED");
  }
  return { supabase, user };
}
