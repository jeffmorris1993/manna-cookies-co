import "server-only";

/**
 * Best-effort realtime ping to every open browser tab: "drop data changed,
 * refetch now." Public pages subscribe to this channel and refresh instantly
 * instead of waiting for the next poll. Never throws — freshness is a bonus,
 * not a dependency.
 */
export async function notifyDropChanged(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ topic: "drop-updates", event: "changed", payload: {} }],
      }),
    });
  } catch {
    /* polling remains the fallback */
  }
}
