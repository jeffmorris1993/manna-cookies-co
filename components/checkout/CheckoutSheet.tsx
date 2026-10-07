"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LiveDropView, PackageKind } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { downloadPickupIcs } from "@/lib/ics";
import { useSquarePayments, type WalletKind } from "./useSquarePayments";

type Confirmation = { orderNumber: string; total: number };

const LABEL: React.CSSProperties = { fontSize: 11, letterSpacing: ".18em", fontWeight: 500 };
const INPUT: React.CSSProperties = {
  height: 54,
  border: "1px solid rgba(74,38,22,.3)",
  background: "#FFFFFF",
  borderRadius: 10,
  padding: "0 14px",
  fontSize: 16,
  letterSpacing: 0,
  fontWeight: 400,
  color: "#24150D",
  outline: "none",
};

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
  const [payTab, setPayTab] = useState<"card" | "wallet">("card");
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

  const changeOrder = (nextPkg?: PackageKind, nextWindow?: string | null) => {
    idemKey.current = crypto.randomUUID();
    if (nextPkg) setPkg(nextPkg);
    if (nextWindow !== undefined) setWindowId(nextWindow);
  };

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

  const setErrR = (m: string): false => {
    setErr(m);
    return false;
  };
  const validateDetails = (): boolean => {
    if (!name.trim()) return setErrR("Please add your name.");
    if (phone.replace(/\D/g, "").length < 7)
      return setErrR("Please add a phone number we can text.");
    if (!/.+@.+\..+/.test(email)) return setErrR("Please add a valid email.");
    return true;
  };

  const next = () => {
    setErr("");
    if (step === 1) setStep(2);
    else if (step === 2) {
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
      router.refresh();
    } catch (e) {
      // fresh idempotency key so the next attempt is a new reservation and a
      // new Square payment — never a replay of the failed one
      idemKey.current = crypto.randomUUID();
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

  const stepTitle = ["Choose quantity", "Your details", "Pickup", "Payment", ""][step - 1] || "";
  const shortDate = drop.pickupShort.replace(/^PICKUP /, "");

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center" role="dialog" aria-modal>
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(20,11,6,.6)", animation: "mannaFade .3s ease" }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 540,
          maxHeight: "92svh",
          overflow: "auto",
          background: "#FBF8F1",
          borderRadius: "22px 22px 0 0",
          padding: "14px 22px 30px",
          animation: "mannaSheet .45s cubic-bezier(.2,.8,.2,1)",
        }}
      >
        <div
          style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(74,38,22,.2)", margin: "0 auto 18px" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: ".24em", fontWeight: 500, color: "#8A6440" }}>
            {step === 5 ? "CONFIRMED" : `STEP ${step} OF 5`}
          </div>
          <button
            onClick={onClose}
            aria-label="Close checkout"
            className="cursor-pointer border-0 bg-transparent"
            style={{ width: 44, height: 44, marginRight: -10, fontSize: 24, color: "#4A2616" }}
          >
            ×
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 4, marginTop: 4 }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              style={{
                height: 2,
                background: s <= step ? "#4A2616" : "rgba(74,38,22,.15)",
                transition: "background .4s",
              }}
            />
          ))}
        </div>
        {stepTitle && (
          <div className="font-display" style={{ marginTop: 24, fontSize: 30, lineHeight: 1.1 }}>
            {stepTitle}
          </div>
        )}

        {step >= 2 && step <= 3 && selected && (
          <div
            style={{
              marginTop: 18,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              background: "#F2EBDF",
            }}
          >
            <div>
              <div style={{ fontSize: 12, letterSpacing: ".16em", fontWeight: 500 }}>{selected.title}</div>
              <div style={{ fontSize: 13, color: "#5A4334", marginTop: 3 }}>
                {selected.sub} · {formatMoney(selected.priceCents)}
              </div>
            </div>
            <button
              onClick={() => {
                changeOrder();
                setStep(1);
              }}
              className="cursor-pointer border-0 bg-transparent"
              style={{ fontSize: 13, color: "#4A2616", textDecoration: "underline", padding: "8px 0" }}
            >
              Change
            </button>
          </div>
        )}

        {step === 1 && (
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            {drop.packages.map((p) => {
              const on = p.kind === pkg;
              const dis = !p.available;
              return (
                <button
                  key={p.kind}
                  disabled={dis}
                  onClick={() => {
                    changeOrder(p.kind);
                    setStep(2);
                  }}
                  className={dis ? "cursor-not-allowed" : "cursor-pointer"}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    minHeight: 68,
                    padding: "0 18px",
                    border: `1px solid ${on ? "#24150D" : "rgba(74,38,22,.25)"}`,
                    background: on ? "#F2EBDF" : "#FFFFFF",
                    color: "#24150D",
                    opacity: dis ? 0.45 : 1,
                    textAlign: "left",
                  }}
                >
                  <span>
                    <span style={{ display: "block", fontSize: 12, letterSpacing: ".16em", fontWeight: 500 }}>
                      {p.title}
                    </span>
                    <span style={{ display: "block", fontSize: 13, color: "#5A4334", marginTop: 3 }}>
                      {p.sub}
                      {dis ? " · NOT ENOUGH LEFT" : ""}
                    </span>
                  </span>
                  <span className="font-display" style={{ fontSize: 24 }}>
                    {formatMoney(p.priceCents)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, ...LABEL }}>
              NAME
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Your name"
                style={INPUT}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, ...LABEL }}>
              PHONE
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                autoComplete="tel"
                placeholder="(555) 555-0100"
                style={INPUT}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, ...LABEL }}>
              EMAIL
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                placeholder="you@email.com"
                style={INPUT}
              />
            </label>
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
          <div style={{ marginTop: 20 }}>
            <div style={LABEL}>PICKUP DATE</div>
            <div
              style={{
                marginTop: 8,
                padding: "16px 18px",
                border: "1px solid #4A2616",
                background: "#F5EFE4",
                display: "flex",
                flexWrap: "wrap",
                gap: "6px 12px",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className="font-display" style={{ fontSize: 20 }}>
                {drop.pickupDateLabel}
              </span>
              <span style={{ fontSize: 10, letterSpacing: ".2em", color: "#8A6440" }}>
                THIS WEEK&apos;S BAKE
              </span>
            </div>
            <div style={{ marginTop: 20, ...LABEL }}>AVAILABLE PICKUP WINDOW</div>
            <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {drop.windows.map((w) => {
                const on = w.id === windowId;
                return (
                  <button
                    key={w.id}
                    disabled={w.full}
                    onClick={() => changeOrder(undefined, w.id)}
                    className={w.full ? "cursor-not-allowed" : "cursor-pointer"}
                    style={{
                      minHeight: 62,
                      border: `1px solid ${on ? "#24150D" : "rgba(74,38,22,.25)"}`,
                      background: on ? "#24150D" : "#FFFFFF",
                      color: on ? "#F5EFE4" : "#24150D",
                      fontSize: 14,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                      opacity: w.full ? 0.45 : 1,
                    }}
                  >
                    <span>{w.label}</span>
                    <span style={{ fontSize: 9, letterSpacing: ".2em" }}>
                      {w.full ? "FULL" : on ? "SELECTED" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && selected && (
          <div style={{ marginTop: 20 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                fontSize: 14,
                paddingBottom: 18,
                borderBottom: "1px solid rgba(74,38,22,.15)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#5A4334" }}>Pickup</span>
                <span>
                  {shortDate} · {selectedWindow?.label}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#5A4334" }}>Name</span>
                <span>{name}</span>
              </div>
              <div
                className="font-display"
                style={{ display: "flex", justifyContent: "space-between", fontSize: 22, marginTop: 4 }}
              >
                <span>Total</span>
                <span>{formatMoney(selected.priceCents)}</span>
              </div>
            </div>

            <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {(["card", "wallet"] as const).map((m) => {
                const on = payTab === m;
                return (
                  <button
                    key={m}
                    onClick={() => setPayTab(m)}
                    className="cursor-pointer"
                    style={{
                      height: 50,
                      border: `1px solid ${on ? "#24150D" : "rgba(74,38,22,.25)"}`,
                      background: on ? "#24150D" : "#FFFFFF",
                      color: on ? "#F5EFE4" : "#24150D",
                      fontSize: 12,
                      letterSpacing: ".16em",
                      fontWeight: 500,
                    }}
                  >
                    {m === "card" ? "CARD" : "WALLET"}
                  </button>
                );
              })}
            </div>

            {square.error && (
              <div style={{ marginTop: 14, fontSize: 13, color: "#8A3B1E" }}>{square.error}</div>
            )}

            <div style={{ display: payTab === "card" ? "block" : "none" }}>
              <div
                style={{
                  marginTop: 12,
                  border: "1px solid rgba(74,38,22,.3)",
                  borderRadius: 10,
                  background: "#FFFFFF",
                  padding: "12px 14px 2px",
                }}
              >
                <div id="card-container" />
                {!square.ready && !square.error && (
                  <p style={{ padding: "4px 0 14px", fontSize: 13, color: "#6E5546" }}>
                    Loading secure card field…
                  </p>
                )}
              </div>
              <button
                onClick={() => pay("card")}
                disabled={!square.ready || processing}
                className="cursor-pointer border-0 disabled:opacity-60"
                style={{
                  marginTop: 18,
                  width: "100%",
                  height: 58,
                  background: "#24150D",
                  color: "#F5EFE4",
                  fontSize: 13,
                  letterSpacing: ".22em",
                  fontWeight: 500,
                }}
              >
                {processing ? "PROCESSING…" : `PAY ${formatMoney(selected.priceCents)}`}
              </button>
            </div>

            <div style={{ display: payTab === "wallet" ? "block" : "none", marginTop: 12 }}>
              <div id="google-pay-button" style={{ display: square.wallets.includes("googlePay") ? "block" : "none" }} />
              {square.wallets.includes("applePay") && (
                <button
                  onClick={() => pay("applePay")}
                  disabled={processing}
                  aria-label="Pay with Apple Pay"
                  className="cursor-pointer border-0"
                  style={{
                    marginTop: 10,
                    width: "100%",
                    height: 50,
                    borderRadius: 6,
                    background: "#000",
                    color: "#fff",
                    WebkitAppearance: "-apple-pay-button" as never,
                  }}
                />
              )}
              {square.wallets.length === 0 && (
                <div style={{ padding: "16px 4px", fontSize: 13, color: "#6E5546", textAlign: "center" }}>
                  Apple Pay and Google Pay appear here on supported devices. Use the card tab instead.
                </div>
              )}
            </div>

            <div style={{ marginTop: 10, textAlign: "center", fontSize: 12, color: "#6E5546" }}>
              Secure payment by Square
              {process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT !== "production" &&
                " · Sandbox mode — test cards only"}
            </div>
          </div>
        )}

        {step === 5 && confirmation && selected && (
          <div style={{ marginTop: 8, textAlign: "center", animation: "mannaIn .6s ease" }}>
            <Image src="/logo.png" alt="" width={92} height={92} style={{ marginTop: 8, display: "inline-block" }} />
            <div
              className="font-display"
              style={{ marginTop: 16, fontSize: "clamp(28px,7vw,36px)", lineHeight: 1.1, letterSpacing: ".04em" }}
            >
              YOUR MANNA
              <br />
              IS RESERVED.
            </div>
            <div
              style={{
                marginTop: 26,
                display: "flex",
                flexDirection: "column",
                textAlign: "left",
                borderTop: "1px solid rgba(74,38,22,.15)",
              }}
            >
              {[
                ["Order", `${selected.name} · ${selected.count} cookies`],
                ["Pickup date", drop.pickupDateLabel],
                ["Pickup window", selectedWindow?.label ?? ""],
                ["Order number", confirmation.orderNumber],
              ].map(([k, v], i) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "14px 0",
                    borderBottom: "1px solid rgba(74,38,22,.15)",
                    fontSize: 14,
                  }}
                >
                  <span style={{ color: "#5A4334", flex: "none" }}>{k}</span>
                  <span style={i === 3 ? { fontWeight: 500, letterSpacing: ".08em" } : { textAlign: "right" }}>
                    {v}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={addToCalendar}
              className="cursor-pointer"
              style={{
                marginTop: 22,
                width: "100%",
                height: 54,
                border: "1px solid #24150D",
                background: "transparent",
                color: "#24150D",
                fontSize: 12,
                letterSpacing: ".2em",
                fontWeight: 500,
              }}
            >
              ADD PICKUP TO CALENDAR
            </button>
            <button
              onClick={onClose}
              className="cursor-pointer border-0"
              style={{
                marginTop: 8,
                width: "100%",
                height: 54,
                background: "#24150D",
                color: "#F5EFE4",
                fontSize: 12,
                letterSpacing: ".2em",
                fontWeight: 500,
              }}
            >
              DONE
            </button>
          </div>
        )}

        {err && step !== 5 && <div style={{ marginTop: 14, fontSize: 13, color: "#8A3B1E" }}>{err}</div>}

        {step >= 1 && step <= 3 && (
          <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
            {step >= 2 && (
              <button
                onClick={back}
                className="cursor-pointer"
                style={{
                  flex: "0 0 auto",
                  height: 56,
                  padding: "0 22px",
                  border: "1px solid rgba(74,38,22,.35)",
                  background: "transparent",
                  color: "#24150D",
                  fontSize: 12,
                  letterSpacing: ".2em",
                  fontWeight: 500,
                }}
              >
                BACK
              </button>
            )}
            <button
              onClick={next}
              className="cursor-pointer border-0"
              style={{
                flex: 1,
                height: 56,
                background: "#24150D",
                color: "#F5EFE4",
                fontSize: 12,
                letterSpacing: ".22em",
                fontWeight: 500,
              }}
            >
              CONTINUE
            </button>
          </div>
        )}
        {step === 4 && (
          <button
            onClick={back}
            className="mt-3 w-full cursor-pointer border-0 bg-transparent py-2"
            style={{ fontSize: 11, letterSpacing: ".2em", color: "#8A7466" }}
          >
            BACK
          </button>
        )}
      </div>
    </div>
  );
}
