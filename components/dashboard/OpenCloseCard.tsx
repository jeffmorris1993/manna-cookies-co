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
      toast(
        res.ok
          ? isOpen
            ? "Orders closed on the website"
            : "Orders are open"
          : (res.error ?? "Couldn't update"),
      );
    });

  return (
    <div
      style={{
        background: "#FBF8F1",
        borderRadius: 16,
        padding: 18,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: isOpen ? "#7A8C4E" : "#A8927F",
          }}
        />
        <div>
          <div style={{ fontSize: 14, letterSpacing: ".18em", fontWeight: 600 }}>
            {isOpen ? "ORDERS OPEN" : "ORDERS CLOSED"}
          </div>
          <div style={{ fontSize: 13, color: "#6E5546", marginTop: 2 }}>Deadline {deadlineLabel}</div>
        </div>
      </div>
      <button
        onClick={toggle}
        disabled={pending}
        className="cursor-pointer border-0 disabled:opacity-60"
        style={{
          height: 52,
          padding: "0 22px",
          borderRadius: 12,
          background: isOpen ? "#24150D" : "#C9A57E",
          color: isOpen ? "#F5EFE4" : "#24150D",
          fontSize: 12,
          letterSpacing: ".18em",
          fontWeight: 600,
        }}
      >
        {pending ? "…" : isOpen ? "CLOSE ORDERS" : "OPEN ORDERS"}
      </button>
    </div>
  );
}
