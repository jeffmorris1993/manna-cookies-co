"use client";

import { useTransition } from "react";
import { toggleOpen } from "@/app/dashboard/actions";
import { useToast } from "./Toast";

export default function OpenCloseCard({
  dropId,
  isOpen,
  deadlineLabel,
}: {
  dropId: string;
  isOpen: boolean;
  deadlineLabel: string;
}) {
  const [pending, start] = useTransition();
  const toast = useToast();

  const toggle = () =>
    start(async () => {
      const res = await toggleOpen(dropId, !isOpen);
      toast(res.ok ? (isOpen ? "Orders closed" : "Orders open") : (res.error ?? "Couldn't update"));
    });

  return (
    <div className="mt-4 flex items-center justify-between border border-brown/10 bg-cream-raised px-5 py-4">
      <div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: isOpen ? "#7A8C4E" : "#A8927F" }}
          />
          <span className="eyebrow text-ink">{isOpen ? "Orders Open" : "Orders Closed"}</span>
        </div>
        <p className="mt-1 text-xs text-muted-2">Deadline {deadlineLabel}</p>
      </div>
      <button
        onClick={toggle}
        disabled={pending}
        className={`eyebrow px-5 py-3 transition-all duration-300 disabled:opacity-60 ${
          isOpen
            ? "border border-brown/30 text-brown hover:border-brown"
            : "bg-ink text-cream hover:tracking-[0.42em]"
        }`}
      >
        {pending ? "…" : isOpen ? "Close Orders" : "Open Orders"}
      </button>
    </div>
  );
}
