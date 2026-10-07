"use client";

import { useState } from "react";

export default function WaitlistForm({ dropId }: { dropId: string | null }) {
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
      <div
        className="font-display italic"
        style={{ marginTop: 28, fontSize: 20, animation: "mannaIn .5s ease" }}
      >
        You&apos;re on the list.
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}
    >
      <label htmlFor="waitlist-contact" className="sr-only">
        Email or phone
      </label>
      <input
        id="waitlist-contact"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        placeholder="Email or phone"
        style={{
          flex: "1 1 220px",
          height: 54,
          border: "1px solid rgba(74,38,22,.35)",
          background: "#FFFFFF",
          padding: "0 16px",
          fontSize: 16,
          color: "#24150D",
          outline: "none",
        }}
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
        className="cursor-pointer border-0 disabled:opacity-60"
        style={{
          flex: "0 0 auto",
          height: 54,
          background: "#24150D",
          color: "#F5EFE4",
          padding: "0 24px",
          fontSize: 12,
          letterSpacing: ".2em",
          fontWeight: 500,
        }}
      >
        {state === "busy" ? "JOINING…" : "JOIN THE NEXT DROP"}
      </button>
      {error && (
        <p style={{ width: "100%", fontSize: 13, color: "#8A3B1E", margin: 0 }}>{error}</p>
      )}
    </form>
  );
}
