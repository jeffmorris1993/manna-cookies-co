"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LiveDropView, PackageKind } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { downloadPickupIcs } from "@/lib/ics";
import { useSquarePayments, type WalletKind } from "./useSquarePayments";

type Confirmation = { orderNumber: string; total: number };

export default function CheckoutSheet({
  drop: initialDrop,
  initialPackage,
  onClose,
}: {
  drop: LiveDropView;
  initialPackage: PackageKind;
  onClose: () => void;
}) {
  const router = useRouter();
  const [drop, setDrop] = useState(initialDrop);
  const [step, setStep] = useState(2); // selecting a package jumps straight to details
  const [pkg, setPkg] = useState<PackageKind>(initialPackage);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [windowId, setWindowId] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [processing, setProcessing] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [website, setWebsite] = useState(""); // honeypot
  const idemKey = useRef<string>(crypto.randomUUID());

  const selected = useMemo(
    () => drop.packages.find((p) => p.kind === pkg) ?? drop.packages[0],
    [drop.packages, pkg],
  );
  const selectedWindow = useMemo(
    () => drop.windows.find((w) => w.id === windowId) ?? null,
    [drop.windows, windowId],
  );

  const refreshDrop = useCallback(async () => {
    try {
      const res = await fetch("/api/drop");
      if (!res.ok) return;
      const body = (await res.json()) as { drop: LiveDropView | null };
      if (body.drop) setDrop(body.drop);
    } catch {
      /* keep the stale snapshot */
    }
  }, []);

  useEffect(() => {
    refreshDrop();
  }, [refreshDrop]);

  // fresh payment identity when the order itself changes
  const changeOrder = (nextPkg?: PackageKind, nextWindow?: string | null) => {
    idemKey.current = crypto.randomUUID();
    if (nextPkg) setPkg(nextPkg);
    if (nextWindow !== undefined) setWindowId(nextWindow);
  };

  // lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const square = useSquarePayments(
    step === 4 && !confirmation,
    selected?.priceCents ?? 0,
    "Manna Cookies & Co.",
  );

  const validateDetails = (): boolean => {
    if (!name.trim()) return setErrR("Please add your name.");
    if (phone.replace(/\D/g, "").length < 7)
      return setErrR("Please add a phone number we can text.");
    if (!/.+@.+\..+/.test(email)) return setErrR("Please add a valid email.");
    return true;
  };
  const setErrR = (m: string): false => {
    setErr(m);
    return false;
  };

  const next = () => {
    setErr("");
    if (step === 1) {
      if (!selected?.available) return;
      setStep(2);
    } else if (step === 2) {
      if (validateDetails()) setStep(3);
    } else if (step === 3) {
      if (!windowId) {
        setErr("Choose a pickup window.");
        return;
      }
      setStep(4);
    }
  };
  const back = () => {
    setErr("");
    if (step > 1) setStep(step - 1);
  };

  const pay = async (method: "card" | WalletKind) => {
    if (processing || !selected) return;
    setErr("");
    setProcessing(true);
    try {
      const sourceToken = await square.tokenize(method);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: idemKey.current,
          dropId: drop.id,
          windowId,
          package: selected.kind,
          name: name.trim(),
          phone,
          email: email.trim(),
          sourceToken,
          website,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 409) {
          await refreshDrop();
          if (body?.code === "WINDOW_FULL") {
            setWindowId(null);
            setStep(3);
          } else {
            setStep(1);
          }
        }
        throw new Error(body?.error ?? "Something went wrong. Please try again.");
      }
      setConfirmation({ orderNumber: body.orderNumber, total: body.total });
      setStep(5);
      router.refresh(); // update the availability bar behind the sheet
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const addToCalendar = () => {
    if (!confirmation || !selected || !selectedWindow) return;
    downloadPickupIcs({
      orderNumber: confirmation.orderNumber,
      packageName: selected.name,
      cookie: drop.cookie,
      pickupDateISO: drop.pickupDateISO,
      windowStart: selectedWindow.starts,
      windowEnd: selectedWindow.ends,
    });
  };

  const stepTitle =
    step === 1
      ? "Choose quantity"
      : step === 2
        ? "Your details"
        : step === 3
          ? "Pickup"
          : step === 4
            ? "Payment"
            : "";

  const inputCls =
    "w-full border border-brown/25 bg-cream-raised px-4 py-3.5 text-[15px] text-ink outline-none transition-colors placeholder:text-muted-2 focus:border-brown";
  const labelCls = "eyebrow mb-2 block text-left text-muted-2";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal>
      <button
        aria-label="Close checkout"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        style={{ background: "rgba(20,11,6,.6)" }}
      />
      <div
        className="relative flex w-full max-w-[540px] flex-col overflow-hidden rounded-t-[22px] bg-cream-raised"
        style={{ animation: "mannaSheet .45s cubic-bezier(.2,.7,.2,1) both", maxHeight: "92svh" }}
      >
        <div className="flex-none px-6 pt-3 sm:px-8">
          <div className="mx-auto h-1 w-10 rounded-full bg-brown/20" />
          {/* progress */}
          <div className="mt-5 flex gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-[3px] flex-1 rounded ${s <= step ? "bg-brown" : "bg-brown/15"}`}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="eyebrow text-muted-2">
              {step === 5 ? "Confirmed" : `Step ${step} of 5`}
            </span>
            {step >= 2 && step <= 4 && selected && (
              <button
                onClick={() => {
                  changeOrder();
                  setStep(1);
                }}
                className="eyebrow text-brown underline-offset-4 hover:underline"
              >
                {selected.title} · {formatMoney(selected.priceCents)} — Change
              </button>
            )}
          </div>
          {stepTitle && (
            <h2 className="mt-4 text-left font-display text-3xl font-medium text-ink">
              {stepTitle}
            </h2>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-5 sm:px-8">
          {step === 1 && (
            <div className="flex flex-col gap-3">
              {drop.packages.map((p) => (
                <button
                  key={p.kind}
                  disabled={!p.available}
                  onClick={() => {
                    changeOrder(p.kind);
                    setStep(2);
                  }}
                  className={`flex items-center justify-between border px-5 py-4 text-left transition-colors ${
                    p.kind === pkg ? "border-brown bg-cream-sunk" : "border-brown/20"
                  } ${p.available ? "hover:border-brown" : "cursor-not-allowed opacity-50"}`}
                >
                  <span>
                    <span className="eyebrow block text-ink">{p.title}</span>
                    <span className="mt-1 block text-xs tracking-[0.15em] text-muted-2">
                      {p.sub.toUpperCase()}
                      {!p.available && " · NOT ENOUGH LEFT"}
                    </span>
                  </span>
                  <span className="font-display text-2xl text-ink">
                    {formatMoney(p.priceCents)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="co-name" className={labelCls}>
                  Name
                </label>
                <input
                  id="co-name"
                  className={inputCls}
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="co-phone" className={labelCls}>
                  Phone
                </label>
                <input
                  id="co-phone"
                  type="tel"
                  className={inputCls}
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="co-email" className={labelCls}>
                  Email
                </label>
                <input
                  id="co-email"
                  type="email"
                  className={inputCls}
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {/* honeypot */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label htmlFor="co-website">Website</label>
                <input
                  id="co-website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-left">
              <div className="border border-brown/20 bg-cream-sunk px-5 py-4">
                <span className={labelCls}>Pickup date</span>
                <span className="font-display text-xl text-ink">{drop.pickupDateLabel}</span>
                <span className="eyebrow mt-1 block text-muted-2" style={{ fontSize: "9px" }}>
                  This week&apos;s bake
                </span>
              </div>
              <span className={`${labelCls} mt-6`}>Available pickup window</span>
              <div className="grid grid-cols-2 gap-3">
                {drop.windows.map((w) => {
                  const isSel = w.id === windowId;
                  return (
                    <button
                      key={w.id}
                      disabled={w.full}
                      onClick={() => changeOrder(undefined, w.id)}
                      className={`border px-4 py-3.5 text-center transition-colors ${
                        isSel
                          ? "border-brown bg-ink text-cream"
                          : w.full
                            ? "cursor-not-allowed border-brown/10 text-muted-2 opacity-60"
                            : "border-brown/25 text-ink hover:border-brown"
                      }`}
                    >
                      <span className="block text-sm">{w.label}</span>
                      <span className="eyebrow mt-1 block" style={{ fontSize: "8px" }}>
                        {w.full ? "Full" : isSel ? "Selected" : " "}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && selected && (
            <div className="text-left">
              <div className="flex flex-col gap-2 border-b border-brown/15 pb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Pickup</span>
                  <span className="text-ink">
                    {drop.pickupDateLabel} · {selectedWindow?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Name</span>
                  <span className="text-ink">{name}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-ink">Total</span>
                  <span className="font-display text-xl text-ink">
                    {formatMoney(selected.priceCents)}
                  </span>
                </div>
              </div>

              {square.error && <p className="mt-4 text-sm text-error">{square.error}</p>}

              <div className="mt-5">
                <span className={labelCls}>Card</span>
                <div id="card-container" />
                {!square.ready && !square.error && (
                  <p className="py-3 text-sm text-muted-2">Loading secure card field…</p>
                )}
              </div>

              <button
                onClick={() => pay("card")}
                disabled={!square.ready || processing}
                className="eyebrow mt-5 w-full bg-ink px-6 py-4 text-cream transition-all duration-300 hover:tracking-[0.42em] disabled:opacity-60"
              >
                {processing ? "Processing…" : `Pay ${formatMoney(selected.priceCents)}`}
              </button>

              {square.wallets.length > 0 && (
                <div className="mt-4 flex flex-col gap-3">
                  <span className="eyebrow block text-center text-muted-2" style={{ fontSize: "9px" }}>
                    or pay with
                  </span>
                  <div id="google-pay-button" className={square.wallets.includes("googlePay") ? "" : "hidden"} />
                  {square.wallets.includes("applePay") && (
                    <button
                      onClick={() => pay("applePay")}
                      disabled={processing}
                      className="h-12 w-full rounded-md bg-black text-cream"
                      style={{ WebkitAppearance: "-apple-pay-button" as never }}
                      aria-label="Pay with Apple Pay"
                    />
                  )}
                </div>
              )}

              <p className="eyebrow mt-5 text-center text-muted-2" style={{ fontSize: "8.5px" }}>
                Secure payment by Square
                {process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT !== "production" &&
                  " · Sandbox mode — test cards only"}
              </p>
            </div>
          )}

          {step === 5 && confirmation && selected && (
            <div className="flex flex-col items-center pb-2 text-center">
              <Image src="/logo.png" alt="" width={92} height={92} />
              <h2 className="mt-5 font-display text-3xl font-medium text-ink">
                YOUR MANNA IS RESERVED.
              </h2>
              <div className="mt-7 w-full max-w-xs text-sm">
                {[
                  ["Order", `${selected.name} · ${drop.cookie}`],
                  ["Pickup date", drop.pickupDateLabel],
                  ["Pickup window", selectedWindow?.label ?? ""],
                  ["Order number", confirmation.orderNumber],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-6 border-b border-brown/10 py-2.5">
                    <span className="flex-none text-muted">{k}</span>
                    <span className="text-right font-medium text-ink">{v}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={addToCalendar}
                className="eyebrow mt-7 w-full border border-brown/30 px-6 py-4 text-brown transition-colors hover:border-brown"
              >
                Add Pickup to Calendar
              </button>
              <button
                onClick={onClose}
                className="eyebrow mt-3 w-full bg-ink px-6 py-4 text-cream transition-all duration-300 hover:tracking-[0.42em]"
              >
                Done
              </button>
            </div>
          )}

          {err && step !== 5 && <p className="mt-4 text-sm text-error">{err}</p>}

          {step >= 1 && step <= 3 && (
            <div className="mt-6 flex gap-3">
              {step >= 2 && (
                <button
                  onClick={back}
                  className="eyebrow flex-1 border border-brown/30 px-6 py-4 text-brown transition-colors hover:border-brown"
                >
                  Back
                </button>
              )}
              <button
                onClick={next}
                className="eyebrow flex-1 bg-ink px-6 py-4 text-cream transition-all duration-300 hover:tracking-[0.42em]"
              >
                Continue
              </button>
            </div>
          )}
          {step === 4 && (
            <button onClick={back} className="eyebrow mt-3 w-full py-2 text-muted-2 hover:text-brown">
              Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
