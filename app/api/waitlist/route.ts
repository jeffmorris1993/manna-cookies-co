import { NextResponse } from "next/server";
import { waitlistSchema } from "@/lib/schemas";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { allowRequest, clientIp } from "@/lib/ratelimit";
import { normalizePhone } from "@/lib/format";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Please check your details.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const { dropId, contact, website } = parsed.data;

  // Honeypot: pretend success, store nothing.
  if (website !== "") {
    return NextResponse.json({ ok: true });
  }

  const ip = clientIp(req);
  const allowed = await allowRequest(`waitlist:${ip}`, 5, 600);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a few minutes." },
      { status: 429 },
    );
  }

  // Store emails lowercased and phones normalized so duplicates collapse.
  const isEmail = /.+@.+\..+/.test(contact);
  const normalized = isEmail ? contact.toLowerCase() : (normalizePhone(contact) ?? contact);

  const db = supabaseAdmin();
  const { error } = await db
    .from("waitlist_entries")
    .upsert(
      { drop_id: dropId ?? null, contact: normalized },
      { onConflict: "drop_id,contact", ignoreDuplicates: true },
    );
  if (error) {
    console.error("waitlist_insert_error", error.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
