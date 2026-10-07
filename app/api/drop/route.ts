import { NextResponse } from "next/server";
import { getLiveDropView } from "@/lib/live-drop";
import { allowRequest, clientIp } from "@/lib/ratelimit";

/** Availability snapshot, polled by the checkout sheet. */
export async function GET(req: Request) {
  const ok = await allowRequest(`drop:${clientIp(req)}`, 30, 60);
  if (!ok) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  try {
    const drop = await getLiveDropView();
    return NextResponse.json({ drop }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("drop_route_error", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
