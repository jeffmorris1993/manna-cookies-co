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

/**
 * Client IP for rate-limit buckets. Prefers Vercel's trusted header; falls
 * back to the LAST x-forwarded-for hop (the proxy-appended one) — the first
 * hop is client-controlled in a standard XFF chain.
 */
export function clientIp(req: Request): string {
  const vercel = req.headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0]!.trim();
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const hops = fwd.split(",").map((s) => s.trim()).filter(Boolean);
    if (hops.length) return hops[hops.length - 1]!;
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}
