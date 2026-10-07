"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { deadlineTimestamp } from "@/lib/deadline";
import { PACKAGE_KINDS } from "@/lib/types";

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
  description: z.string().trim().max(300),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid pickup date."),
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
      pickup_date: d.pickupDate,
      deadline: deadlineTimestamp(d.pickupDate),
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
        .update({ starts: w.starts, ends: w.ends, is_full: w.full, sort: i })
        .eq("id", w.id)
        .eq("drop_id", d.dropId); // never touch another drop's window
      if (error) return fail("Couldn't save a pickup window.");
    } else {
      const { error } = await supabase
        .from("pickup_windows")
        .insert({ drop_id: d.dropId, starts: w.starts, ends: w.ends, is_full: w.full, sort: i });
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

/** New scheduled drop one week after the latest, copying packages + windows. */
export async function createNextDrop(fromDropId: string): Promise<ActionResult> {
  let supabase;
  try {
    ({ supabase } = await requireOwner());
  } catch {
    return fail("Not signed in.");
  }
  if (!z.uuid().safeParse(fromDropId).success) return fail("Invalid request.");

  const { data: src } = await supabase
    .from("drops")
    .select("cookie, description, capacity")
    .eq("id", fromDropId)
    .single();
  if (!src) return fail("Source drop not found.");

  const { data: latest } = await supabase
    .from("drops")
    .select("pickup_date")
    .order("pickup_date", { ascending: false })
    .limit(1)
    .single();
  const base = latest ? new Date(`${latest.pickup_date}T12:00:00Z`) : new Date();
  base.setUTCDate(base.getUTCDate() + 7);
  const pickup = base.toISOString().slice(0, 10);

  const { data: created, error } = await supabase
    .from("drops")
    .insert({
      cookie: src.cookie,
      description: src.description,
      pickup_date: pickup,
      deadline: deadlineTimestamp(pickup),
      capacity: src.capacity,
      status: "scheduled",
      is_open: true,
    })
    .select("id")
    .single();
  if (error || !created) return fail("Couldn't create the next drop.");

  const { data: pkgs } = await supabase
    .from("drop_packages")
    .select("kind, enabled, price_cents")
    .eq("drop_id", fromDropId);
  const pkgRows = PACKAGE_KINDS.map((kind) => {
    const src2 = pkgs?.find((p) => p.kind === kind);
    return {
      drop_id: created.id,
      kind,
      enabled: src2?.enabled ?? true,
      price_cents: src2?.price_cents ?? 1400,
    };
  });
  await supabase.from("drop_packages").insert(pkgRows);

  const { data: wins } = await supabase
    .from("pickup_windows")
    .select("starts, ends, sort")
    .eq("drop_id", fromDropId)
    .order("sort");
  if (wins?.length) {
    await supabase.from("pickup_windows").insert(
      wins.map((w) => ({
        drop_id: created.id,
        starts: w.starts,
        ends: w.ends,
        is_full: false,
        sort: w.sort,
      })),
    );
  }

  revalidateDashboard();
  return { ok: true, id: created.id };
}
