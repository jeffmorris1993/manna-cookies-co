"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Minimal typings for the Square Web Payments SDK */
type TokenResult = { status: string; token?: string; errors?: { message?: string }[] };
interface SqPaymentMethod {
  attach(selector: string): Promise<void>;
  tokenize(): Promise<TokenResult>;
  destroy?(): Promise<void>;
}
interface SqPaymentRequest {
  update?(opts: unknown): void;
}
interface SqPayments {
  card(): Promise<SqPaymentMethod>;
  paymentRequest(opts: {
    countryCode: string;
    currencyCode: string;
    total: { amount: string; label: string };
  }): SqPaymentRequest;
  googlePay(req: SqPaymentRequest): Promise<SqPaymentMethod>;
  applePay(req: SqPaymentRequest): Promise<SqPaymentMethod>;
}
declare global {
  interface Window {
    Square?: { payments(appId: string, locationId: string): Promise<SqPayments> };
  }
}

const SDK_URL =
  process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT === "production"
    ? "https://web.squarecdn.com/v1/square.js"
    : "https://sandbox.web.squarecdn.com/v1/square.js";

let sdkPromise: Promise<void> | null = null;
function loadSdk(): Promise<void> {
  if (window.Square) return Promise.resolve();
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SDK_URL;
      s.onload = () => resolve();
      s.onerror = () => {
        sdkPromise = null;
        reject(new Error("Payment system failed to load. Check your connection and try again."));
      };
      document.head.appendChild(s);
    });
  }
  return sdkPromise;
}

export type WalletKind = "applePay" | "googlePay";

/**
 * Loads the Web Payments SDK, attaches the card field to #card-container and
 * wallet buttons when supported. totalCents drives the wallet payment sheet.
 */
export function useSquarePayments(active: boolean, totalCents: number, label: string) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [wallets, setWallets] = useState<WalletKind[]>([]);
  const cardRef = useRef<SqPaymentMethod | null>(null);
  const walletRefs = useRef<Partial<Record<WalletKind, SqPaymentMethod>>>({});

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    (async () => {
      try {
        await loadSdk();
        const payments = await window.Square!.payments(
          process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!,
          process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
        );
        if (cancelled) return;

        const card = await payments.card();
        if (cancelled) { card.destroy?.(); return; }
        await card.attach("#card-container");
        cardRef.current = card;
        setReady(true);

        const req = payments.paymentRequest({
          countryCode: "US",
          currencyCode: "USD",
          total: { amount: (totalCents / 100).toFixed(2), label },
        });

        const found: WalletKind[] = [];
        try {
          const gp = await payments.googlePay(req);
          await gp.attach("#google-pay-button");
          walletRefs.current.googlePay = gp;
          found.push("googlePay");
        } catch (e) {
          console.warn("google_pay_unavailable", e); // diagnostic: why the button is hidden
        }
        try {
          const ap = await payments.applePay(req);
          walletRefs.current.applePay = ap; // Apple Pay uses a styled button, no attach
          found.push("applePay");
        } catch (e) {
          console.warn("apple_pay_unavailable", e); // expected outside Safari / without Wallet
        }
        if (!cancelled) setWallets(found);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Payment system failed to load.");
      }
    })();

    return () => {
      cancelled = true;
      cardRef.current?.destroy?.();
      cardRef.current = null;
      Object.values(walletRefs.current).forEach((w) => w?.destroy?.());
      walletRefs.current = {};
      setReady(false);
      setWallets([]);
    };
    // totalCents/label intentionally omitted: the sheet unmounts between orders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const tokenize = useCallback(async (method: "card" | WalletKind): Promise<string> => {
    const m = method === "card" ? cardRef.current : walletRefs.current[method];
    if (!m) throw new Error("Payment method not ready.");
    const result = await m.tokenize();
    if (result.status !== "OK" || !result.token) {
      throw new Error(result.errors?.[0]?.message ?? "Card details look incomplete.");
    }
    return result.token;
  }, []);

  return { ready, error, wallets, tokenize };
}
