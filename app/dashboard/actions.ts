"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { deadlineTimestamp } from "@/lib/deadline";
import { PACKAGE_KINDS, PACKAGE_META } from "@/lib/types";

export type ActionResult = { ok: boolean; error?: string; id?: string };

function fail(error: string): ActionResult {
  return { ok: false, error };
}

function revalidateDashboard() {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/", "page"); // public availability reflects dashboard changes
}

/* ---------------- orders ---------------- */

const statusSchema = z.object({
  orderId: z.uuid(),
  status: z.enum(["new", "preparing", "ready", "picked"]),
});

export async function updateOrderStatus(orderId: string, status: string): Promise<ActionResult> {
  let supabase;
  try {
    ({ supabase } = await requireOwner());
  } catch {
    return fail("Not signed in.");
  }
  const parsed = statusSchema.safeParse({ orderId, status });
  if (!parsed.success) return fail("Invalid request.");

  // only legal pipeline moves
  const TRANSITIONS: Record<string, string[]> = {
    new: ["preparing", "ready"],
    preparing: ["ready"],
    ready: ["picked"],
    picked: ["ready"], // undo
  };
  const { data: current } = await supabase
    .from("orders")
    .select("status")
    .eq("id", parsed.data.orderId)
    .maybeSingle();
  if (!current) return fail("Order not found.");
  if (!TRANSITIONS[current.status]?.includes(parsed.data.status)) {
    return fail("That status change isn't allowed.");
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.orderId)
    .eq("status", current.status);
  if (error) return fail("Couldn't update the order.");
  revalidateDashboard();
  return { ok: true };
}

/* ---------------- drops ---------------- */

export async function toggleOpen(dropId: string, open: boolean): Promise<ActionResult> {
  let supabase;
  try {
    ({ supabase } = await requireOwner());
  } catch {
    return fail("Not signed in.");
  }
  if (!z.uuid().safeParse(dropId).success) return fail("Invalid request.");

  const { error } = await supabase.from("drops").update({ is_open: open }).eq("id", dropId);
  if (error) return fail("Couldn't update ordering.");
  revalidateDashboard();
  return { ok: true };
}

const saveDropSchema = z.object({
  dropId: z.uuid(),
  cookie: z.string().trim().min(1, "Give the cookie a name.").max(120),
  description: z.string().trim().max(280, "Keep the description under 280 characters."),
  deadlineDays: z.number().int().min(0).max(7),
  capacity: z
    .number()
    .int()
    .min(12)
    .max(480)
    .refine((n) => n % 6 === 0, "Capacity moves in steps of 6."),
  isOpen: z.boolean(),
  windows: z
    .array(
      z.object({
        id: z.uuid().nullable(), // null = new window
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Give each window a date."),
        starts: z.string().regex(/^\d{2}:\d{2}$/),
        ends: z.string().regex(/^\d{2}:\d{2}$/),
        full: z.boolean(),
      }),
    )
    .min(1, "Keep at least one pickup window.")
    .max(12),
  packages: z.array(
    z.object({
      kind: z.enum(["three", "half", "dozen"]),
      enabled: z.boolean(),
      priceCents: z.number().int().min(100).max(100000),
    }),
  ),
});
export type SaveDropInput = z.infer<typeof saveDropSchema>;

export async function saveDrop(input: SaveDropInput): Promise<ActionResult> {
  let supabase;
  try {
    ({ supabase } = await requireOwner());
  } catch {
    return fail("Not signed in.");
  }
  const parsed = saveDropSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the drop details.");
  const d = parsed.data;

  // completed drops are a historical record — never rewrite them
  const { data: target } = await supabase
    .from("drops")
    .select("status")
    .eq("id", d.dropId)
    .maybeSingle();
  if (!target) return fail("Drop not found.");
  if (target.status === "complete") return fail("Completed drops can't be edited.");

  for (const w of d.windows) {
    if (w.ends <= w.starts) return fail("Each pickup window must end after it starts.");
  }

  // pickup can span several days; the drop's date is the earliest window day
  const pickupDate = [...d.windows].map((w) => w.date).sort()[0]!;
  const deadlineIso = deadlineTimestamp(pickupDate, d.deadlineDays);
  if (target.status !== "complete" && new Date(deadlineIso).getTime() <= Date.now()) {
    return fail(
      `With a ${d.deadlineDays}-day deadline, the first pickup day must be later — ordering would already be closed.`,
    );
  }

  // capacity can't drop below what's already reserved
  const { data: reservedRows } = await supabase
    .from("orders")
    .select("cookie_count, status")
    .eq("drop_id", d.dropId)
    .in("status", ["pending", "new", "preparing", "ready", "picked"]);
  const reserved = (reservedRows ?? []).reduce((s, r) => s + r.cookie_count, 0);
  if (d.capacity < reserved) {
    return fail(`Capacity can't go below the ${reserved} cookies already reserved.`);
  }

  const { error: dropErr } = await supabase
    .from("drops")
    .update({
      cookie: d.cookie,
      description: d.description,
      pickup_date: pickupDate,
      deadline: deadlineIso,
      deadline_days: d.deadlineDays,
      capacity: d.capacity,
      is_open: d.isOpen,
    })
    .eq("id", d.dropId);
  if (dropErr) return fail("Couldn't save the drop.");

  // windows: upsert the submitted set, remove the rest (unless orders point at them)
  const { data: existing } = await supabase
    .from("pickup_windows")
    .select("id")
    .eq("drop_id", d.dropId);
  const submittedIds = new Set(d.windows.filter((w) => w.id).map((w) => w.id as string));
  const toDelete = (existing ?? []).map((w) => w.id).filter((id) => !submittedIds.has(id));

  for (const [i, w] of d.windows.entries()) {
    if (w.id) {
      const { error } = await supabase
        .from("pickup_windows")
        .update({ pickup_date: w.date, starts: w.starts, ends: w.ends, is_full: w.full, sort: i })
        .eq("id", w.id)
        .eq("drop_id", d.dropId); // never touch another drop's window
      if (error) return fail("Couldn't save a pickup window.");
    } else {
      const { error } = await supabase
        .from("pickup_windows")
        .insert({ drop_id: d.dropId, pickup_date: w.date, starts: w.starts, ends: w.ends, is_full: w.full, sort: i });
      if (error) return fail("Couldn't add a pickup window.");
    }
  }
  if (toDelete.length) {
    const { error } = await supabase.from("pickup_windows").delete().in("id", toDelete);
    if (error) return fail("A removed window still has orders — mark it full instead.");
  }

  for (const p of d.packages) {
    const { error } = await supabase
      .from("drop_packages")
      .update({ enabled: p.enabled, price_cents: p.priceCents })
      .eq("drop_id", d.dropId)
      .eq("kind", p.kind);
    if (error) return fail("Couldn't save package pricing.");
  }

  revalidateDashboard();
  return { ok: true };
}

export async function makeLive(dropId: string): Promise<ActionResult> {
  let supabase;
  try {
    ({ supabase } = await requireOwner());
  } catch {
    return fail("Not signed in.");
  }
  if (!z.uuid().safeParse(dropId).success) return fail("Invalid request.");

  const { data: current } = await supabase
    .from("drops")
    .select("id")
    .eq("status", "live")
    .maybeSingle();
  if (current && current.id !== dropId) {
    const { error } = await supabase
      .from("drops")
      .update({ status: "complete", is_open: false })
      .eq("id", current.id);
    if (error) return fail("Couldn't close the current drop.");
  }
  const { error } = await supabase.from("drops").update({ status: "live" }).eq("id", dropId);
  if (error) return fail("Couldn't make this drop live.");
  revalidateDashboard();
  return { ok: true };
}

const DEFAULT_WINDOWS = [
  { starts: "09:00", ends: "11:00" },
  { starts: "11:00", ends: "13:00" },
  { starts: "13:00", ends: "15:00" },
  { starts: "15:00", ends: "17:00" },
];

/**
 * New scheduled drop. With a source drop: one week after the latest, copying
 * its packages + windows. With null (first drop ever): blank cookie, default
 * prices/windows, next Saturday.
 */
export async function createNextDrop(fromDropId: string | null): Promise<ActionResult> {
  let supabase;
  try {
    ({ supabase } = await requireOwner());
  } catch {
    return fail("Not signed in.");
  }
  if (fromDropId !== null && !z.uuid().safeParse(fromDropId).success) {
    return fail("Invalid request.");
  }

  let src: { cookie: string; description: string; capacity: number; deadline_days: number } | null =
    null;
  if (fromDropId) {
    const { data } = await supabase
      .from("drops")
      .select("cookie, description, capacity, deadline_days")
      .eq("id", fromDropId)
      .single();
    if (!data) return fail("Source drop not found.");
    src = data;
  }

  const { data: defDays } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "deadline_days")
    .maybeSingle();
  const deadlineDays = src?.deadline_days ?? Math.min(7, Math.max(0, parseInt(defDays?.value ?? "2", 10) || 2));

  const { data: latest } = await supabase
    .from("drops")
    .select("pickup_date")
    .order("pickup_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  let pickup: string;
  if (latest) {
    const base = new Date(`${latest.pickup_date}T12:00:00Z`);
    base.setUTCDate(base.getUTCDate() + 7);
    pickup = base.toISOString().slice(0, 10);
  } else {
    // first drop: next Saturday (at least 3 days out so the deadline is future)
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 3);
    while (d.getUTCDay() !== 6) d.setUTCDate(d.getUTCDate() + 1);
    pickup = d.toISOString().slice(0, 10);
  }

  const { data: created, error } = await supabase
    .from("drops")
    .insert({
      cookie: src?.cookie ?? "",
      description: src?.description ?? "",
      pickup_date: pickup,
      deadline: deadlineTimestamp(pickup, deadlineDays),
      deadline_days: deadlineDays,
      capacity: src?.capacity ?? 60,
      status: "scheduled",
      is_open: true,
    })
    .select("id")
    .single();
  if (error || !created) return fail("Couldn't create the next drop.");

  const { data: pkgs } = fromDropId
    ? await supabase
        .from("drop_packages")
        .select("kind, enabled, price_cents")
        .eq("drop_id", fromDropId)
    : { data: null };
  const pkgRows = PACKAGE_KINDS.map((kind) => {
    const src2 = pkgs?.find((p) => p.kind === kind);
    return {
      drop_id: created.id,
      kind,
      enabled: src2?.enabled ?? true,
      price_cents: src2?.price_cents ?? PACKAGE_META[kind].defaultPriceCents,
    };
  });
  await supabase.from("drop_packages").insert(pkgRows);

  const plusWeek = (iso: string) => {
    const dt = new Date(`${iso}T12:00:00Z`);
    dt.setUTCDate(dt.getUTCDate() + 7);
    return dt.toISOString().slice(0, 10);
  };
  const { data: wins } = fromDropId
    ? await supabase
        .from("pickup_windows")
        .select("starts, ends, sort, pickup_date")
        .eq("drop_id", fromDropId)
        .order("sort")
    : { data: null };
  const winRows = (
    wins?.length
      ? wins.map((w) => ({ ...w, pickup_date: plusWeek(w.pickup_date) }))
      : DEFAULT_WINDOWS.map((w, i) => ({ ...w, sort: i, pickup_date: pickup }))
  ).map((w) => ({
    drop_id: created.id,
    pickup_date: w.pickup_date,
    starts: w.starts,
    ends: w.ends,
    is_full: false,
    sort: w.sort,
  }));
  await supabase.from("pickup_windows").insert(winRows);
  // keep the drop's date aligned with its earliest window
  const minDate = winRows.map((w) => w.pickup_date).sort()[0]!;
  await supabase
    .from("drops")
    .update({ pickup_date: minDate, deadline: deadlineTimestamp(minDate, deadlineDays) })
    .eq("id", created.id);

  revalidateDashboard();
  return { ok: true, id: created.id };
}

/* ---------------- drop photo ---------------- */

const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PHOTO_MAX_BYTES = 8 * 1024 * 1024;

export async function uploadDropPhoto(dropId: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireOwner();
  } catch {
    return fail("Not signed in.");
  }
  if (!z.uuid().safeParse(dropId).success) return fail("Invalid request.");

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return fail("Choose a photo first.");
  if (!PHOTO_TYPES.has(file.type)) return fail("Use a JPEG, PNG, or WebP image.");
  if (file.size > PHOTO_MAX_BYTES) return fail("Photos must be under 8 MB.");

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `drops/${dropId}/${Date.now()}.${ext}`;

  const admin = supabaseAdmin();
  const { error: upErr } = await admin.storage
    .from("drop-photos")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) {
    console.error("drop_photo_upload_error", upErr.message);
    return fail("Couldn't upload the photo. Please try again.");
  }

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/drop-photos/${path}`;
  const { error } = await admin.from("drops").update({ photo_url: url }).eq("id", dropId);
  if (error) return fail("Couldn't save the photo.");

  revalidateDashboard();
  return { ok: true };
}

export async function removeDropPhoto(dropId: string): Promise<ActionResult> {
  let supabase;
  try {
    ({ supabase } = await requireOwner());
  } catch {
    return fail("Not signed in.");
  }
  if (!z.uuid().safeParse(dropId).success) return fail("Invalid request.");

  const { error } = await supabase.from("drops").update({ photo_url: null }).eq("id", dropId);
  if (error) return fail("Couldn't remove the photo.");
  revalidateDashboard();
  return { ok: true };
}

/* ---------------- settings ---------------- */

export async function saveOrderSettings(
  address: string,
  deadlineDays: number,
): Promise<ActionResult> {
  let supabase;
  try {
    ({ supabase } = await requireOwner());
  } catch {
    return fail("Not signed in.");
  }
  const addr = z.string().trim().max(200).safeParse(address);
  const days = z.number().int().min(0).max(7).safeParse(deadlineDays);
  if (!addr.success) return fail("Keep the address under 200 characters.");
  if (!days.success) return fail("Deadline must be between 0 and 7 days.");

  const now = new Date().toISOString();
  const { error } = await supabase.from("app_settings").upsert([
    { key: "pickup_address", value: addr.data, updated_at: now },
    { key: "deadline_days", value: String(days.data), updated_at: now },
  ]);
  if (error) return fail("Couldn't save settings.");
  revalidateDashboard();
  return { ok: true };
}

export async function savePickupAddress(address: string): Promise<ActionResult> {
  let supabase;
  try {
    ({ supabase } = await requireOwner());
  } catch {
    return fail("Not signed in.");
  }
  const parsed = z.string().trim().max(200).safeParse(address);
  if (!parsed.success) return fail("Keep the address under 200 characters.");

  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "pickup_address", value: parsed.data, updated_at: new Date().toISOString() });
  if (error) return fail("Couldn't save the address.");
  revalidateDashboard();
  return { ok: true };
}
