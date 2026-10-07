"use client";

import { useActionState } from "react";
import { updatePassword, type ResetState } from "./actions";

const inputCls =
  "w-full border border-brown/25 bg-cream px-4 py-3.5 text-[15px] text-ink outline-none transition-colors focus:border-brown";

export default function ResetForm() {
  const [state, action, pending] = useActionState<ResetState, FormData>(updatePassword, {});

  return (
    <form action={action} className="mt-8 flex flex-col gap-4 text-left">
      <div>
        <label htmlFor="password" className="eyebrow mb-2 block text-muted-2">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor="confirm" className="eyebrow mb-2 block text-muted-2">
          Confirm password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
          className={inputCls}
        />
      </div>
      {state.error && <p className="text-sm text-error">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="eyebrow mt-2 w-full bg-ink px-6 py-4 text-cream transition-all duration-300 hover:tracking-[0.42em] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save Password"}
      </button>
    </form>
  );
}
