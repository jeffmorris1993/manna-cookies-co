import { NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/schemas";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { squareClient, SQUARE_LOCATION_ID } from "@/lib/square";
import { allowRequest, clientIp } from "@/lib/ratelimit";
import { normalizePhone, displayOrderNumber } from "@/lib/format";
import { PACKAGE_META } from "@/lib/types";
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
  SOLD_OUT: {
    status: 409,
    code: "SOLD_OUT",
    message: "Not enough cookies left for that package.",
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

export async function POST(req: Request) {
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
    return NextResponse.json({
      ok: true,
      orderNumber: "MC-0000",
      total: 0,
    });
  }

  const phone = normalizePhone(input.phone);
  if (!phone) {
    return NextResponse.json(
      { error: "Please add a phone number we can text." },
      { status: 400 },
    );
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

  const square = squareClient();
  const locationId = SQUARE_LOCATION_ID();
  const pkgName = PACKAGE_META[input.package].name;

  try {
    // 2. Square customer: find by phone, else create.
    let squareCustomerId: string | undefined;
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
        // sale over it. Retry without the phone, then without a customer at all.
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

    // 3. Square order.
    const { data: dropRow } = await db
      .from("drops")
      .select("cookie")
      .eq("id", input.dropId)
      .single();
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
      },
    });
    const squareOrderId = orderRes.order?.id;

    // 4. Square payment — idempotency key shared with our reservation, so a
    //    double submit can never double-charge.
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
    if (!payment || (payment.status !== "COMPLETED" && payment.status !== "APPROVED")) {
      throw new Error(`payment_status_${payment?.status ?? "missing"}`);
    }

    // 5. Confirm in our DB (retry a few times — money has been taken).
    let confirmed = false;
    for (let attempt = 0; attempt < 3 && !confirmed; attempt++) {
      const { error: confirmErr } = await db.rpc("confirm_order", {
        p_order_id: reserved.order_id,
        p_square_order_id: squareOrderId ?? null,
        p_square_payment_id: payment.id ?? null,
        p_square_customer_id: squareCustomerId ?? null,
      });
      if (!confirmErr) confirmed = true;
      else if (attempt === 2) {
        console.error("CRITICAL_UNCONFIRMED_PAYMENT", {
          orderId: reserved.order_id,
          orderNumber,
          squarePaymentId: payment.id,
          idempotencyKey: input.idempotencyKey,
          error: confirmErr.message,
        });
      }
    }

    return NextResponse.json({ ok: true, orderNumber, total: reserved.price_cents });
  } catch (err) {
    // Payment failed or Square unavailable → free the reserved cookies.
    await db.rpc("release_order", { p_order_id: reserved.order_id });

    if (err instanceof SquareError) {
      const first = err.errors?.[0];
      const declined =
        first?.category === "PAYMENT_METHOD_ERROR" ||
        ["CARD_DECLINED", "CVV_FAILURE", "ADDRESS_VERIFICATION_FAILURE", "INVALID_CARD",
          "GENERIC_DECLINE", "INSUFFICIENT_FUNDS", "CARD_EXPIRED"].includes(first?.code ?? "");
      if (declined) {
        return NextResponse.json(
          { error: "Your card was declined. Please try another card.", code: "DECLINED" },
          { status: 402 },
        );
      }
      console.error("square_error", JSON.stringify(err.errors));
      return NextResponse.json(
        { error: "Payment couldn't be processed. Please try again.", code: "SQUARE_ERROR" },
        { status: 502 },
      );
    }

    console.error("checkout_error", err);
    return NextResponse.json(
      { error: "Something went wrong. You have not been charged.", code: "UNKNOWN" },
      { status: 500 },
    );
  }
}
