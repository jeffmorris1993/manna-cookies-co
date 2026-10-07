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
      className="eyebrow mt-5 w-full border border-dashed border-brown/40 px-6 py-5 text-brown transition-colors hover:border-brown disabled:opacity-60"
    >
      {pending ? "Creating…" : "+ Create Next Drop"}
    </button>
  );
}
