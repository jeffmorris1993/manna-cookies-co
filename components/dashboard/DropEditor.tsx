"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveDrop, makeLive, createNextDrop } from "@/app/dashboard/actions";
import { formatMoney, shortDate } from "@/lib/format";
import { PACKAGE_META, type PackageKind } from "@/lib/types";
import { useToast } from "./Toast";

type EditorDrop = {
  id: string;
  cookie: string;
  description: string;
  pickupDate: string;
  capacity: number;
  status: "live" | "scheduled" | "complete";
  isOpen: boolean;
  reserved: number;
  revenue: number;
};
type EditorPkg = { kind: PackageKind; enabled: boolean; priceCents: number };
type EditorWin = { id: string | null; starts: string; ends: string; full: boolean };

const LONG_STATUS: Record<EditorDrop["status"], string> = {
  live: "LIVE ON THE WEBSITE",
  scheduled: "UP NEXT · NOT LIVE YET",
  complete: "COMPLETED DROP",
};

const NOTE: Record<EditorDrop["status"], string | null> = {
  live: null,
  scheduled:
    "This drop isn't on the website yet. When you make it live, the current drop closes and customers see this cookie.",
  complete:
    "This drop is complete. Its settings are kept for your records and can be reused for a future drop.",
};

export default function DropEditor({
  drop,
  packages,
  windows,
}: {
  drop: EditorDrop;
  packages: EditorPkg[];
  windows: EditorWin[];
}) {
  const [cookie, setCookie] = useState(drop.cookie);
  const [description, setDescription] = useState(drop.description);
  const [pickupDate, setPickupDate] = useState(drop.pickupDate);
  const [capacity, setCapacity] = useState(drop.capacity);
  const [isOpen, setIsOpen] = useState(drop.isOpen);
  const [wins, setWins] = useState<EditorWin[]>(windows);
  const [pkgs, setPkgs] = useState<EditorPkg[]>(packages);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  const readOnly = drop.status === "complete";
  const remaining = Math.max(0, capacity - drop.reserved);
  const pct = capacity ? Math.min(100, Math.round((drop.reserved / capacity) * 100)) : 0;
  const capMin = Math.max(12, Math.ceil(drop.reserved / 6) * 6 || 12);

  const addWindow = () => {
    const last = wins[wins.length - 1];
    let startH = 9;
    if (last) startH = Math.min(21, Number(last.ends.slice(0, 2)) ?? 9);
    const endH = Math.min(21, startH + 2);
    if (startH >= 21) {
      toast("No room for another window before 9 PM");
      return;
    }
    setWins([
      ...wins,
      {
        id: null,
        starts: `${String(startH).padStart(2, "0")}:00`,
        ends: `${String(endH).padStart(2, "0")}:00`,
        full: false,
      },
    ]);
  };

  const removeWindow = (i: number) => {
    if (wins.length <= 1) {
      toast("Keep at least one pickup window");
      return;
    }
    setWins(wins.filter((_, j) => j !== i));
  };

  const save = (then?: "makeLive") =>
    start(async () => {
      const res = await saveDrop({
        dropId: drop.id,
        cookie,
        description,
        pickupDate,
        capacity,
        isOpen,
        windows: wins,
        packages: pkgs.map((p) => ({ ...p })),
      });
      if (!res.ok) {
        toast(res.error ?? "Couldn't save");
        return;
      }
      if (then === "makeLive") {
        const liveRes = await makeLive(drop.id);
        toast(liveRes.ok ? "This drop is now live" : (liveRes.error ?? "Couldn't make live"));
        if (liveRes.ok) router.refresh();
      } else {
        toast(drop.status === "live" ? "Drop saved · live on the website" : "Drop saved");
        router.refresh();
      }
    });

  const reuse = () =>
    start(async () => {
      const res = await createNextDrop(drop.id);
      if (res.ok && res.id) {
        toast("New drop created from this one");
        router.push(`/dashboard/drops/${res.id}`);
      } else toast(res.error ?? "Couldn't create drop");
    });

  const inputCls =
    "w-full border border-brown/20 bg-cream px-4 py-3 text-[15px] text-ink outline-none transition-colors focus:border-brown disabled:opacity-60";

  return (
    <main className="pt-8">
      <Link href="/dashboard/drops" className="eyebrow text-muted-2 hover:text-brown">
        ← All drops
      </Link>
      <h1 className="mt-3 font-display text-4xl font-medium text-ink">Edit Drop</h1>

      {/* summary */}
      <div className="mt-6 bg-ink px-6 py-6 text-cream">
        <span className="eyebrow text-gold" style={{ fontSize: "9px" }}>
          {LONG_STATUS[drop.status]}
        </span>
        <p className="mt-2 font-display text-2xl">{cookie || "Untitled cookie"}</p>
        <p className="mt-1 text-sm text-cream-dark-muted">{shortDate(pickupDate)}</p>
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="font-display text-2xl">{capacity}</div>
            <div className="eyebrow mt-1 text-cream-dark-muted" style={{ fontSize: "7.5px" }}>
              Total Capacity
            </div>
          </div>
          <div>
            <div className="font-display text-2xl">{drop.reserved}</div>
            <div className="eyebrow mt-1 text-cream-dark-muted" style={{ fontSize: "7.5px" }}>
              {drop.status === "complete" ? "Sold" : "Reserved"}
            </div>
          </div>
          <div>
            <div className="font-display text-2xl">{remaining}</div>
            <div className="eyebrow mt-1 text-cream-dark-muted" style={{ fontSize: "7.5px" }}>
              Remaining
            </div>
          </div>
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded bg-cream/10">
          <div className="h-full rounded bg-gold" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-3 text-xs text-cream-dark-muted">{formatMoney(drop.revenue)} collected</p>
      </div>

      {NOTE[drop.status] && (
        <p className="mt-4 bg-tan-soft px-5 py-4 text-sm leading-relaxed text-ink">
          {NOTE[drop.status]}
        </p>
      )}

      {/* details */}
      <section className="mt-4 border border-brown/10 bg-cream-raised px-5 py-5">
        <h2 className="eyebrow text-muted-2">Details</h2>
        <div className="mt-4 flex flex-col gap-4">
          <div>
            <label className="eyebrow mb-2 block text-muted-2" style={{ fontSize: "8.5px" }} htmlFor="d-cookie">
              Cookie
            </label>
            <input
              id="d-cookie"
              className={`${inputCls} font-display text-lg`}
              value={cookie}
              disabled={readOnly}
              onChange={(e) => setCookie(e.target.value)}
            />
          </div>
          <div>
            <label className="eyebrow mb-2 block text-muted-2" style={{ fontSize: "8.5px" }} htmlFor="d-desc">
              Description
            </label>
            <textarea
              id="d-desc"
              rows={2}
              className={inputCls}
              value={description}
              disabled={readOnly}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {drop.status === "live" && (
            <div className="flex items-center justify-between">
              <span className="eyebrow text-muted-2" style={{ fontSize: "8.5px" }}>
                Orders open
              </span>
              <button
                role="switch"
                aria-checked={isOpen}
                onClick={() => setIsOpen(!isOpen)}
                className="relative h-7 w-12 rounded-full transition-colors"
                style={{ background: isOpen ? "#4A2616" : "#D9CBB6" }}
              >
                <span
                  className="absolute top-0.5 h-6 w-6 rounded-full bg-cream transition-transform"
                  style={{ transform: isOpen ? "translateX(22px)" : "translateX(2px)", left: 0 }}
                />
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="eyebrow mb-2 block text-muted-2" style={{ fontSize: "8.5px" }} htmlFor="d-date">
                Pickup date
              </label>
              <input
                id="d-date"
                type="date"
                className={inputCls}
                value={pickupDate}
                disabled={readOnly}
                onChange={(e) => setPickupDate(e.target.value)}
              />
            </div>
            <div>
              <span className="eyebrow mb-2 block text-muted-2" style={{ fontSize: "8.5px" }}>
                Maximum cookies
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={readOnly || capacity <= capMin}
                  onClick={() => setCapacity(Math.max(capMin, capacity - 6))}
                  className="h-11 w-11 border border-brown/20 text-lg text-brown disabled:opacity-40"
                  aria-label="Decrease capacity"
                >
                  −
                </button>
                <span className="flex-1 text-center font-display text-xl text-ink">{capacity}</span>
                <button
                  disabled={readOnly || capacity >= 480}
                  onClick={() => setCapacity(Math.min(480, capacity + 6))}
                  className="h-11 w-11 border border-brown/20 text-lg text-brown disabled:opacity-40"
                  aria-label="Increase capacity"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-2">
            Ordering closes automatically 2 days before pickup at 8:00 PM.
          </p>
        </div>
      </section>

      {/* pickup windows */}
      <section className="mt-4 border border-brown/10 bg-cream-raised px-5 py-5">
        <h2 className="eyebrow text-muted-2">Pickup Windows</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Customers choose one at checkout. Mark a window full to stop new orders for it.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          {wins.map((w, i) => (
            <div key={w.id ?? `new-${i}`} className="flex items-center gap-2">
              <input
                type="time"
                value={w.starts}
                disabled={readOnly}
                onChange={(e) =>
                  setWins(wins.map((x, j) => (j === i ? { ...x, starts: e.target.value } : x)))
                }
                className="flex-1 border border-brown/20 bg-cream px-2 py-2.5 text-sm text-ink outline-none focus:border-brown disabled:opacity-60"
              />
              <span className="text-muted-2">–</span>
              <input
                type="time"
                value={w.ends}
                disabled={readOnly}
                onChange={(e) =>
                  setWins(wins.map((x, j) => (j === i ? { ...x, ends: e.target.value } : x)))
                }
                className="flex-1 border border-brown/20 bg-cream px-2 py-2.5 text-sm text-ink outline-none focus:border-brown disabled:opacity-60"
              />
              <button
                disabled={readOnly}
                onClick={() => setWins(wins.map((x, j) => (j === i ? { ...x, full: !x.full } : x)))}
                className={`eyebrow flex-none rounded-full px-3 py-2 ${
                  w.full ? "bg-brown text-cream" : "border border-brown/25 text-muted"
                } disabled:opacity-60`}
                style={{ fontSize: "8px" }}
              >
                {w.full ? "Full" : "Open"}
              </button>
              <button
                disabled={readOnly}
                onClick={() => removeWindow(i)}
                aria-label="Remove window"
                className="flex-none px-2 text-lg text-muted-2 hover:text-error disabled:opacity-40"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {!readOnly && (
          <button
            onClick={addWindow}
            className="eyebrow mt-4 w-full border border-dashed border-brown/40 px-4 py-3.5 text-brown transition-colors hover:border-brown"
            style={{ fontSize: "9px" }}
          >
            + Add Pickup Window
          </button>
        )}
      </section>

      {/* packages */}
      <section className="mt-4 border border-brown/10 bg-cream-raised px-5 py-5">
        <h2 className="eyebrow text-muted-2">Available Package Sizes</h2>
        <div className="mt-4 flex flex-col gap-4">
          {pkgs.map((p, i) => (
            <div key={p.kind} className="flex items-center gap-3">
              <button
                role="switch"
                aria-checked={p.enabled}
                disabled={readOnly}
                onClick={() =>
                  setPkgs(pkgs.map((x, j) => (j === i ? { ...x, enabled: !x.enabled } : x)))
                }
                className="relative h-7 w-12 flex-none rounded-full transition-colors disabled:opacity-60"
                style={{ background: p.enabled ? "#4A2616" : "#D9CBB6" }}
              >
                <span
                  className="absolute top-0.5 h-6 w-6 rounded-full bg-cream transition-transform"
                  style={{ transform: p.enabled ? "translateX(22px)" : "translateX(2px)", left: 0 }}
                />
              </button>
              <div className="min-w-0 flex-1">
                <p className="eyebrow text-ink" style={{ fontSize: "9px" }}>
                  {PACKAGE_META[p.kind].title}
                </p>
                <p className="text-xs text-muted-2">{PACKAGE_META[p.kind].sub}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted">$</span>
                <input
                  inputMode="numeric"
                  className="no-spin w-16 border border-brown/20 bg-cream px-2 py-2 text-right text-sm text-ink outline-none focus:border-brown disabled:opacity-60"
                  value={p.priceCents / 100}
                  disabled={readOnly || !p.enabled}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    const dollars = Math.min(1000, Number(digits || 0));
                    setPkgs(
                      pkgs.map((x, j) => (j === i ? { ...x, priceCents: dollars * 100 } : x)),
                    );
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* actions */}
      <div className="mt-5 flex flex-col gap-3">
        {drop.status === "live" && (
          <button
            disabled={pending}
            onClick={() => save()}
            className="eyebrow w-full bg-ink px-6 py-4 text-cream transition-all duration-300 hover:tracking-[0.42em] disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save Drop"}
          </button>
        )}
        {drop.status === "scheduled" && (
          <>
            <button
              disabled={pending}
              onClick={() => save()}
              className="eyebrow w-full border border-brown/30 px-6 py-4 text-brown transition-colors hover:border-brown disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save Drop"}
            </button>
            <button
              disabled={pending}
              onClick={() => save("makeLive")}
              className="eyebrow w-full bg-ink px-6 py-4 text-cream transition-all duration-300 hover:tracking-[0.42em] disabled:opacity-60"
            >
              {pending ? "Working…" : "Make This the Live Drop"}
            </button>
          </>
        )}
        {drop.status === "complete" && (
          <button
            disabled={pending}
            onClick={reuse}
            className="eyebrow w-full bg-ink px-6 py-4 text-cream transition-all duration-300 hover:tracking-[0.42em] disabled:opacity-60"
          >
            {pending ? "Working…" : "Reuse as Next Drop"}
          </button>
        )}
      </div>
    </main>
  );
}
