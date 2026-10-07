"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createNextDrop } from "@/app/dashboard/actions";
import { useToast } from "./Toast";

export default function CreateNextDropButton({ fromDropId }: { fromDropId: string | null }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  if (!fromDropId) return null;

  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await createNextDrop(fromDropId);
          if (res.ok && res.id) {
            toast("Next drop created");
            router.push(`/dashboard/drops/${res.id}`);
          } else {
            toast(res.error ?? "Couldn't create drop");
          }
        })
      }
      className="cursor-pointer disabled:opacity-60"
      style={{
        height: 58,
        border: "1px dashed #4A2616",
        borderRadius: 14,
        background: "transparent",
        color: "#24150D",
        fontSize: 13,
        letterSpacing: ".2em",
        fontWeight: 600,
      }}
    >
      {pending ? "CREATING…" : "+ CREATE NEXT DROP"}
    </button>
  );
}
