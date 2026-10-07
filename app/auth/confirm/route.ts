import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { allowRequest, clientIp } from "@/lib/ratelimit";

/**
 * Exchanges the password-recovery code from the email link for a session.
 * Must be a route handler: server components can't persist the session
 * cookies that exchangeCodeForSession produces.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const dest = (suffix = "") => new URL(`/reset-password${suffix}`, url.origin);

  if (!code) return NextResponse.redirect(dest());

  const allowed = await allowRequest(`recover:${clientIp(req)}`, 5, 3600);
  if (!allowed) return NextResponse.redirect(dest("?limited=1"));

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.warn("recovery_exchange_failed", error.message);
    return NextResponse.redirect(dest("?invalid=1"));
  }
  return NextResponse.redirect(dest());
}
