import "server-only";
import { supabaseAdmin } from "./supabase/admin";

/**
 * Fixed-window rate limiter backed by Postgres (check_rate_limit RPC).
 * Returns true when the request is ALLOWED.
 * Fails closed: if the limiter itself errors, the request is rejected.
 */
export async function allowRequest(
  bucket: string,
  max: number,
  windowSecs: number,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin().rpc("check_rate_limit", {
    p_bucket: bucket,
    p_max: max,
    p_window_secs: windowSecs,
  });
  if (error) {
    console.error("rate_limit_error", { bucket, error: error.message });
    return false;
  }
  return data === true;
}

/** Client IP from Vercel/proxy headers (first x-forwarded-for hop). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
