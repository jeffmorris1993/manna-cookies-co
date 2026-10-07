"use client";

import { useActionState } from "react";
import { requestReset, type ForgotState } from "./actions";

export default function ForgotForm() {
  const [state, action, pending] = useActionState<ForgotState, FormData>(requestReset, {});

  if (state.done) {
    return (
      <p className="mt-8 border border-brown/20 bg-cream-sunk px-4 py-4 text-sm leading-relaxed text-muted">
        If that account exists, a reset link is on its way. Check your inbox.
      </p>
    );
  }

  return (
    <form action={action} className="mt-8 flex flex-col gap-4 text-left">
      <div>
        <label htmlFor="email" className="eyebrow mb-2 block text-muted-2">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full border border-brown/25 bg-cream px-4 py-3.5 text-[15px] text-ink outline-none transition-colors focus:border-brown"
        />
      </div>
      {/* honeypot */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {state.error && <p className="text-sm text-error">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="eyebrow mt-2 w-full bg-ink px-6 py-4 text-cream transition-all duration-300 hover:tracking-[0.42em] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send Reset Link"}
      </button>
    </form>
  );
}
