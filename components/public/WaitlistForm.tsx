"use client";

import { useState } from "react";

export default function WaitlistForm({ dropId }: { dropId: string }) {
  const [contact, setContact] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — real users never fill this
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "busy") return;
    setError("");
    const trimmed = contact.trim();
    if (trimmed.length < 5) {
      setError("Add an email or phone number so we can reach you.");
      return;
    }
    setState("busy");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dropId, contact: trimmed, website }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Something went wrong. Please try again.");
      }
      setState("done");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  if (state === "done") {
    return (
      <p className="mt-10 font-display text-2xl italic text-brown" data-reveal="fade">
        You&apos;re on the list.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row">
      <label className="sr-only" htmlFor="waitlist-contact">
        Email or phone
      </label>
      <input
        id="waitlist-contact"
        type="text"
        inputMode="email"
        autoComplete="email"
        placeholder="Email or phone"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        className="flex-1 border border-brown/25 bg-cream-raised px-5 py-4 text-sm text-ink outline-none transition-colors placeholder:text-muted-2 focus:border-brown"
      />
      {/* honeypot — hidden from real users, tempting to bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="waitlist-website">Website</label>
        <input
          id="waitlist-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
      <button
        type="submit"
        disabled={state === "busy"}
        className="eyebrow bg-ink px-7 py-4 text-cream transition-all duration-300 hover:tracking-[0.42em] disabled:opacity-60"
      >
        {state === "busy" ? "Joining…" : "Join the Next Drop"}
      </button>
      {error && <p className="w-full text-sm text-error sm:order-last">{error}</p>}
    </form>
  );
}
