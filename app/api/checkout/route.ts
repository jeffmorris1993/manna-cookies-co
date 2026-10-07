import { NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/schemas";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { squareClient, SQUARE_LOCATION_ID } from "@/lib/square";
import { allowRequest, clientIp } from "@/lib/ratelimit";
import { normalizePhone, displayOrderNumber } from "@/lib/format";
import { PACKAGE_META } from "@/lib/types";
import { etOffset } from "@/lib/deadline";
import { SquareError } from "square";

type ReserveResult = {
  order_id: string;
  order_number: number;
  price_cents: number;
  cookie_count: number;
  customer_id: string;
  status: string;
  square_payment_id: string | null;
  replayed: boolean;
};

const RESERVE_ERRORS: Record<string, { status: number; code: string; message: string }> = {
  NOT_LIVE: { status: 409, code: "CLOSED", message: "Ordering just closed for this week." },
  CLOSED: { status: 409, code: "CLOSED", message: "Ordering just closed for this week." },
  SOLD_OUT: { status: 409, code: "SOLD_OUT", message: "Not enough cookies left for that package." },
  BUSY: {
    status: 409,
    code: "BUSY",
    message: "Checkout is busy right now. Please try again in a few minutes.",
  },
  WINDOW_FULL: {
    status: 409,
    code: "WINDOW_FULL",
    message: "That pickup window just filled up. Please choose another.",
  },
  WINDOW_INVALID: {
    status: 409,
    code: "WINDOW_FULL",
    message: "That pickup window is no longer available. Please choose another.",
  },
  PACKAGE_UNAVAILABLE: {
    status: 409,
    code: "SOLD_OUT",
    message: "That package isn't available this week.",
  },
};

const DECLINE_CODES = new Set([
  "CARD_DECLINED",
  "CVV_FAILURE",
  "ADDRESS_VERIFICATION_FAILURE",
  "INVALID_CARD",
  "GENERIC_DECLINE",
  "INSUFFICIENT_FUNDS",
  "CARD_EXPIRED",
  "INVALID_EXPIRATION",
  "CARD_NOT_SUPPORTED",
  "INVALID_CARD_DATA",
  "VERIFY_CVV_FAILURE",
  "VERIFY_AVS_FAILURE",
  "CARD_TOKEN_EXPIRED",
  "CARD_TOKEN_USED",
]);

function isDecline(err: unknown): boolean {
  if (!(err instanceof SquareError)) return false;
  const first = err.errors?.[0];
  return first?.category === "PAYMENT_METHOD_ERROR" || DECLINE_CODES.has(first?.code ?? "");
}

/** Cross-site browser form posts can't set this combination. */
function rejectCrossSite(req: Request): NextResponse | null {
  const secFetch = req.headers.get("sec-fetch-site");
  if (secFetch && secFetch !== "same-origin" && secFetch !== "same-site" && secFetch !== "none") {
    return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  }
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Invalid request." }, { status: 415 });
  }
  return null;
}

export async function POST(req: Request) {
  const crossSite = rejectCrossSite(req);
  if (crossSite) return crossSite;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Please check your details.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const input = parsed.data;

  // Honeypot: fake a success so bots learn nothing. No reservation, no charge.
  if (input.website !== "") {
    const fakeNo = 1000 + (parseInt(input.idempotencyKey.replace(/\D/g, "").slice(0, 4) || "0", 10) % 900);
    return NextResponse.json({ ok: true, orderNumber: `MC-${fakeNo}`, total: 0 });
  }

  const phone = normalizePhone(input.phone);
  if (!phone) {
    return NextResponse.json({ error: "Please add a phone number we can text." }, { status: 400 });
  }

  const ip = clientIp(req);
  const [ipOk, phoneOk] = await Promise.all([
    allowRequest(`checkout:ip:${ip}`, 5, 600),
    allowRequest(`checkout:ph:${phone}`, 3, 600),
  ]);
  if (!ipOk || !phoneOk) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429 },
    );
  }

  const db = supabaseAdmin();

  // 1. Reserve capacity atomically (idempotent on idempotencyKey).
  const { data: reserveData, error: reserveErr } = await db.rpc("reserve_order", {
    p_idempotency_key: input.idempotencyKey,
    p_drop_id: input.dropId,
    p_window_id: input.windowId,
    p_package: input.package,
    p_name: input.name,
    p_phone: phone,
    p_email: input.email.toLowerCase(),
  });
  if (reserveErr) {
    const known = Object.keys(RESERVE_ERRORS).find((k) => reserveErr.message.includes(k));
    if (known) {
      const e = RESERVE_ERRORS[known];
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    }
    console.error("reserve_order_error", reserveErr.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  const reserved = reserveData as ReserveResult;
  const orderNumber = displayOrderNumber(reserved.order_number);

  // Replay of an already-paid order → return the original confirmation.
  if (reserved.replayed && reserved.square_payment_id) {
    return NextResponse.json({ ok: true, orderNumber, total: reserved.price_cents });
  }
  // Replay of a canceled attempt → the client must start a fresh attempt.
  if (reserved.replayed && reserved.status === "canceled") {
    return NextResponse.json(
      { error: "That attempt was canceled. Please try again.", code: "RETRY" },
      { status: 409 },
    );
  }

  const square = squareClient();
  const locationId = SQUARE_LOCATION_ID();
  const pkgName = PACKAGE_META[input.package].name;

  // ---- Stage A: Square customer + order (no money moves here) ----
  let squareCustomerId: string | undefined;
  let squareOrderId: string | undefined;
  try {
    const search = await square.customers.search({
      query: { filter: { phoneNumber: { exact: phone } } },
      limit: BigInt(1),
    });
    squareCustomerId = search.customers?.[0]?.id;
    if (!squareCustomerId) {
      try {
        const createdCustomer = await square.customers.create({
          idempotencyKey: `cust-${input.idempotencyKey}`,
          givenName: input.name,
          emailAddress: input.email.toLowerCase(),
          phoneNumber: phone,
          referenceId: reserved.customer_id,
        });
        squareCustomerId = createdCustomer.customer?.id;
      } catch (custErr) {
        // Square is stricter about phone formats than we are — never lose the
        // sale over it. Retry without the phone.
        const phoneRejected =
          custErr instanceof SquareError &&
          custErr.errors?.some((e) => e.field === "phone_number");
        if (!phoneRejected) throw custErr;
        const retry = await square.customers.create({
          idempotencyKey: `cust2-${input.idempotencyKey}`,
          givenName: input.name,
          emailAddress: input.email.toLowerCase(),
          referenceId: reserved.customer_id,
        });
        squareCustomerId = retry.customer?.id;
      }
    }

    const [{ data: dropRow }, { data: winRow }] = await Promise.all([
      db.from("drops").select("cookie, pickup_date").eq("id", input.dropId).single(),
      db.from("pickup_windows").select("starts").eq("id", input.windowId).single(),
    ]);

    // Pickup fulfillment: makes the order visible in the Square dashboard's
    // Orders view and carries the pickup time into Square's own tooling.
    const pickupAt =
      dropRow?.pickup_date && winRow?.starts
        ? `${dropRow.pickup_date}T${winRow.starts.slice(0, 5)}:00${etOffset(dropRow.pickup_date)}`
        : undefined;

    const orderRes = await square.orders.create({
      idempotencyKey: `order-${input.idempotencyKey}`,
      order: {
        locationId,
        referenceId: orderNumber,
        customerId: squareCustomerId,
        lineItems: [
          {
            name: `${dropRow?.cookie ?? "Manna Cookies"} — ${pkgName}`,
            quantity: "1",
            basePriceMoney: { amount: BigInt(reserved.price_cents), currency: "USD" },
          },
        ],
        ...(pickupAt
          ? {
              fulfillments: [
                {
                  type: "PICKUP",
                  state: "PROPOSED",
                  pickupDetails: {
                    recipient: { displayName: input.name, phoneNumber: phone },
                    pickupAt,
                    note: `Order ${orderNumber}`,
                  },
                },
              ],
            }
          : {}),
      },
    });
    squareOrderId = orderRes.order?.id;
  } catch (err) {
    // No payment was attempted — releasing the hold is unambiguously safe.
    await db.rpc("release_order", { p_order_id: reserved.order_id });
    console.error("checkout_stage_a_error", err instanceof SquareError ? JSON.stringify(err.errors) : err);
    return NextResponse.json(
      { error: "Payment couldn't be processed. You have not been charged.", code: "SQUARE_ERROR" },
      { status: 502 },
    );
  }

  // ---- Stage B: the payment itself. Failures here are classified: only a
  // definitive decline releases the hold; anything indeterminate keeps it and
  // alarms, because the card may have been charged. ----
  try {
    const paymentRes = await square.payments.create({
      idempotencyKey: input.idempotencyKey,
      sourceId: input.sourceToken,
      orderId: squareOrderId,
      customerId: squareCustomerId,
      locationId,
      amountMoney: { amount: BigInt(reserved.price_cents), currency: "USD" },
      ...(input.verificationToken ? { verificationToken: input.verificationToken } : {}),
    });
    const payment = paymentRes.payment;

    if (payment?.status === "FAILED" || payment?.status === "CANCELED") {
      await db.rpc("release_order", { p_order_id: reserved.order_id });
      return NextResponse.json(
        { error: "Your card was declined. Please try another card.", code: "DECLINED" },
        { status: 402 },
      );
    }
    if (!payment || payment.status !== "COMPLETED") {
      // payment exists but is not final — do NOT release; owner reconciles
      console.error("CRITICAL_UNCONFIRMED_PAYMENT", {
        reason: `payment_status_${payment?.status ?? "missing"}`,
        orderId: reserved.order_id,
        orderNumber,
        squarePaymentId: payment?.id,
        idempotencyKey: input.idempotencyKey,
      });
      return NextResponse.json(
        {
          error:
            "We couldn't confirm your payment. Please don't retry — we'll contact you to sort it out.",
          code: "UNCONFIRMED",
        },
        { status: 500 },
      );
    }

    // Confirm in our DB (retry — money has been taken).
    let confirmed = false;
    let lastErr: string | undefined;
    for (let attempt = 0; attempt < 3 && !confirmed; attempt++) {
      const { error: confirmErr } = await db.rpc("confirm_order", {
        p_order_id: reserved.order_id,
        p_square_order_id: squareOrderId ?? null,
        p_square_payment_id: payment.id ?? null,
        p_square_customer_id: squareCustomerId ?? null,
      });
      if (!confirmErr) confirmed = true;
      else lastErr = confirmErr.message;
    }
    if (!confirmed) {
      console.error("CRITICAL_UNCONFIRMED_PAYMENT", {
        reason: "confirm_order_failed",
        orderId: reserved.order_id,
        orderNumber,
        squarePaymentId: payment.id,
        idempotencyKey: input.idempotencyKey,
        error: lastErr,
      });
      // The customer paid — honor the order; the owner reconciles from logs.
    }

    return NextResponse.json({ ok: true, orderNumber, total: reserved.price_cents });
  } catch (err) {
    if (isDecline(err)) {
      await db.rpc("release_order", { p_order_id: reserved.order_id });
      return NextResponse.json(
        { error: "Your card was declined. Please try another card.", code: "DECLINED" },
        { status: 402 },
      );
    }

    // Indeterminate: timeout / 5xx / unknown — Square may have captured the
    // card. Keep the hold, alarm loudly, and tell the customer not to retry.
    console.error("CRITICAL_UNCONFIRMED_PAYMENT", {
      reason: "payment_create_indeterminate",
      orderId: reserved.order_id,
      orderNumber,
      idempotencyKey: input.idempotencyKey,
      error: err instanceof SquareError ? JSON.stringify(err.errors) : String(err),
    });
    return NextResponse.json(
      {
        error:
          "We couldn't confirm your payment. Please don't retry — we'll contact you to sort it out.",
        code: "UNCONFIRMED",
      },
      { status: 500 },
    );
  }
}
