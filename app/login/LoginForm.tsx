"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, type AuthFormState } from "./actions";

const inputCls =
  "w-full border border-brown/25 bg-cream px-4 py-3.5 text-[15px] text-ink outline-none transition-colors placeholder:text-muted-2 focus:border-brown";

export default function LoginForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signIn, {});
  const params = useSearchParams();
  const expired = params.get("expired");
  const reset = params.get("reset");
  // controlled, so a failed attempt doesn't wipe what was typed
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form action={action} className="mt-8 flex flex-col gap-4 text-left">
      {expired && (
        <p className="border border-brown/20 bg-cream-sunk px-4 py-3 text-sm text-muted">
          Your session ended. Please sign in again.
        </p>
      )}
      {reset && (
        <p className="border border-brown/20 bg-cream-sunk px-4 py-3 text-sm text-muted">
          Password updated. Sign in with your new password.
        </p>
      )}
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor="password" className="eyebrow mb-2 block text-muted-2">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
        />
      </div>
      {state.error && <p className="text-sm text-error">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="eyebrow mt-2 w-full bg-ink px-6 py-4 text-cream transition-all duration-300 hover:tracking-[0.42em] disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
