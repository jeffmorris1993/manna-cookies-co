"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveDrop,
  makeLive,
  createNextDrop,
  deleteDrop,
  uploadDropPhoto,
  removeDropPhoto,
} from "@/app/dashboard/actions";
import { formatMoney, parseISODate, longDate } from "@/lib/format";
import { deadlineTimestamp, earliestPickupDate } from "@/lib/deadline";
import { PACKAGE_META, type PackageKind } from "@/lib/types";
import { useToast } from "./Toast";
import DatePicker from "./DatePicker";

type EditorDrop = {
  id: string;
  cookie: string;
  description: string;
  photoUrl: string | null;
  deadlineDays: number;
  capacity: number;
  status: "live" | "scheduled" | "complete";
  isOpen: boolean;
  reserved: number;
  revenue: number;
};
type EditorPkg = { kind: PackageKind; enabled: boolean; priceCents: number };
type EditorWin = { id: string | null; date: string; starts: string; ends: string; full: boolean };

/** Downscale to ≤1600px JPEG client-side so phone photos upload fast. */
async function compressImage(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (blob) return new File([blob], "photo.jpg", { type: "image/jpeg" });
  } catch {
    /* fall through to the original file */
  }
  return file;
}

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

const FIELD_INPUT: React.CSSProperties = {
  height: 44,
  border: "1px solid rgba(74,38,22,.2)",
  borderRadius: 10,
  background: "#FFFFFF",
  padding: "0 10px",
  fontSize: 16,
  color: "#24150D",
  outline: "none",
};
const SECTION_LABEL: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: ".2em",
  fontWeight: 500,
  color: "#6E5546",
};
const ROW: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "8px 12px",
  padding: "10px 0",
  minHeight: 64,
  borderBottom: "1px solid rgba(74,38,22,.1)",
};

function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onClick}
      className="cursor-pointer border-0 disabled:opacity-60"
      style={{
        flex: "0 0 auto",
        width: 52,
        height: 32,
        borderRadius: 16,
        background: on ? "#4A2616" : "#D9CBB6",
        position: "relative",
        transition: "background .3s",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: on ? 23 : 3,
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "#FFFFFF",
          transition: "left .3s",
          boxShadow: "0 1px 3px rgba(0,0,0,.2)",
        }}
      />
    </button>
  );
}

function Stepper({
  value,
  min,
  max,
  step = 1,
  disabled,
  onChange,
  decLabel,
  incLabel,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  onChange: (v: number) => void;
  decLabel: string;
  incLabel: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - step))}
        aria-label={decLabel}
        className="cursor-pointer disabled:opacity-40"
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          border: "1px solid rgba(74,38,22,.25)",
          background: "#FFFFFF",
          fontSize: 20,
          color: "#24150D",
        }}
      >
        −
      </button>
      <span className="font-display" style={{ minWidth: 52, textAlign: "center", fontSize: 24 }}>
        {value}
      </span>
      <button
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + step))}
        aria-label={incLabel}
        className="cursor-pointer disabled:opacity-40"
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          border: "1px solid rgba(74,38,22,.25)",
          background: "#FFFFFF",
          fontSize: 20,
          color: "#24150D",
        }}
      >
        +
      </button>
    </div>
  );
}

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
  const [deadlineDays, setDeadlineDays] = useState(drop.deadlineDays);
  const [capacity, setCapacity] = useState(drop.capacity);
  const [isOpen, setIsOpen] = useState(drop.isOpen);
  const [wins, setWins] = useState<EditorWin[]>(windows);
  const [pkgs, setPkgs] = useState<EditorPkg[]>(packages);
  const [pending, start] = useTransition();
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const toast = useToast();

  const readOnly = drop.status === "complete";
  const remaining = Math.max(0, capacity - drop.reserved);
  const pct = capacity ? Math.min(100, Math.round((drop.reserved / capacity) * 100)) : 0;
  const capMin = Math.max(12, Math.ceil(drop.reserved / 6) * 6 || 12);

  // date picker floor: earliest pickup whose deadline hasn't already passed
  const minPickupDate = earliestPickupDate(deadlineDays);
  const firstPickup = [...wins].map((w) => w.date).sort()[0] ?? minPickupDate;
  const deadlineAt = new Date(deadlineTimestamp(firstPickup, deadlineDays));
  const deadlinePast = deadlineAt.getTime() <= Date.now();
  const deadlineNote = `Orders close ${deadlineAt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  })} · 8:00 PM`;

  const onPhotoPicked = async (file: File | undefined) => {
    if (!file || photoBusy) return;
    setPhotoBusy(true);
    try {
      const compressed = await compressImage(file);
      const fd = new FormData();
      fd.append("photo", compressed);
      const res = await uploadDropPhoto(drop.id, fd);
      toast(res.ok ? "Photo updated" : (res.error ?? "Couldn't upload the photo"));
      if (res.ok) router.refresh();
    } finally {
      setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onPhotoRemove = async () => {
    if (photoBusy) return;
    setPhotoBusy(true);
    try {
      const res = await removeDropPhoto(drop.id);
      toast(res.ok ? "Photo removed" : (res.error ?? "Couldn't remove the photo"));
      if (res.ok) router.refresh();
    } finally {
      setPhotoBusy(false);
    }
  };

  // ---- day-grouped window helpers ----
  const dayDates = [...new Set(wins.map((w) => w.date))].sort();
  const winsFor = (date: string) =>
    wins
      .map((w, i) => ({ w, i }))
      .filter((x) => x.w.date === date)
      .sort((a, b) => a.w.starts.localeCompare(b.w.starts));

  const updateWin = (i: number, patch: Partial<EditorWin>) =>
    setWins(wins.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const changeDayDate = (oldDate: string, newDate: string) =>
    setWins(wins.map((w) => (w.date === oldDate ? { ...w, date: newDate } : w)));

  const addTime = (date: string) => {
    const group = winsFor(date);
    const last = group[group.length - 1]?.w;
    let h = last ? Number(last.ends.slice(0, 2)) : 9;
    h = Math.min(h, 21);
    setWins([
      ...wins,
      {
        id: null,
        date,
        starts: `${String(h).padStart(2, "0")}:00`,
        ends: `${String(Math.min(23, h + 2)).padStart(2, "0")}:00`,
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

  const removeDay = (date: string) => {
    const rest = wins.filter((w) => w.date !== date);
    if (rest.length === 0) {
      toast("Keep at least one pickup day");
      return;
    }
    setWins(rest);
  };

  const addDay = () => {
    const last = dayDates[dayDates.length - 1];
    let next: string;
    if (last) {
      const dt = new Date(`${last}T12:00:00Z`);
      dt.setUTCDate(dt.getUTCDate() + 1);
      next = dt.toISOString().slice(0, 10);
    } else {
      next = minPickupDate;
    }
    if (next < minPickupDate) next = minPickupDate;
    setWins([...wins, { id: null, date: next, starts: "09:00", ends: "11:00", full: false }]);
  };

  const save = (then?: "makeLive") =>
    start(async () => {
      const res = await saveDrop({
        dropId: drop.id,
        cookie,
        description,
        deadlineDays,
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
        toast(liveRes.ok ? "Now live on the website" : (liveRes.error ?? "Couldn't make live"));
        if (liveRes.ok) router.refresh();
      } else {
        toast(drop.status === "live" ? "Drop saved · live on the website" : "Next drop saved");
        router.refresh();
      }
    });

  const reuse = () =>
    start(async () => {
      const res = await createNextDrop(drop.id);
      if (res.ok && res.id) {
        toast("Next drop created · not live yet");
        router.push(`/dashboard/drops/${res.id}`);
      } else toast(res.error ?? "Couldn't create drop");
    });

  const [confirmDelete, setConfirmDelete] = useState(false);
  const onDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    start(async () => {
      const res = await deleteDrop(drop.id);
      if (res.ok) {
        toast("Drop deleted");
        router.push("/dashboard/drops");
        router.refresh();
      } else {
        toast(res.error ?? "Couldn't delete the drop");
        setConfirmDelete(false);
      }
    });
  };

  const actions: { label: string; bg: string; color: string; onClick: () => void }[] =
    drop.status === "live"
      ? [
          { label: "SAVE DROP", bg: "#24150D", color: "#F5EFE4", onClick: () => save() },
          { label: "CREATE NEXT DROP", bg: "transparent", color: "#24150D", onClick: reuse },
        ]
      : drop.status === "scheduled"
        ? [
            { label: "SAVE DROP", bg: "#24150D", color: "#F5EFE4", onClick: () => save() },
            { label: "MAKE THIS THE LIVE DROP", bg: "transparent", color: "#24150D", onClick: () => save("makeLive") },
          ]
        : [{ label: "REUSE AS NEXT DROP", bg: "#24150D", color: "#F5EFE4", onClick: reuse }];

  return (
    <main
      style={{ padding: "12px 0", display: "flex", flexDirection: "column", gap: 14, animation: "mannaIn .35s ease" }}
    >
      <Link href="/dashboard/drops" style={{ fontSize: 14, color: "#4A2616", padding: "4px 0" }}>
        ← All drops
      </Link>

      {/* dark summary */}
      <div style={{ background: "#24150D", color: "#F5EFE4", borderRadius: 16, padding: 20 }}>
        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}
        >
          <div style={{ fontSize: 11, letterSpacing: ".2em", fontWeight: 500, color: "#C9A57E" }}>
            {LONG_STATUS[drop.status]}
          </div>
          <div style={{ fontSize: 12, color: "#D9C8B3" }}>
            {parseISODate(firstPickup).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
        <div className="font-display" style={{ marginTop: 8, fontSize: 26, lineHeight: 1.2 }}>
          {cookie || "Untitled cookie"}
        </div>
        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          {(
            [
              ["TOTAL CAPACITY", capacity],
              [drop.status === "complete" ? "SOLD" : "RESERVED", drop.reserved],
              ["REMAINING", remaining],
            ] as const
          ).map(([l, v]) => (
            <div key={l}>
              <div style={{ fontSize: 10, letterSpacing: ".14em", color: "#D9C8B3" }}>{l}</div>
              <div className="font-display" style={{ marginTop: 4, fontSize: 30 }}>
                {v}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{ marginTop: 14, height: 6, borderRadius: 3, background: "rgba(245,239,228,.15)", overflow: "hidden" }}
        >
          <div style={{ height: "100%", width: `${pct}%`, background: "#C9A57E", transition: "width .6s ease" }} />
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: "#D9C8B3" }}>
          {formatMoney(drop.revenue)} collected
        </div>
      </div>

      {NOTE[drop.status] && (
        <div
          style={{
            background: "#EADCC6",
            borderRadius: 14,
            padding: "14px 16px",
            fontSize: 14,
            lineHeight: 1.5,
            color: "#4A2616",
          }}
        >
          {NOTE[drop.status]}
        </div>
      )}

      {/* details */}
      <div style={{ background: "#FBF8F1", borderRadius: 16, padding: "16px 18px 6px" }}>
        <div style={SECTION_LABEL}>COOKIE</div>
        <input
          value={cookie}
          disabled={readOnly}
          onChange={(e) => setCookie(e.target.value)}
          placeholder="Cookie name"
          className="font-display disabled:opacity-60"
          style={{ ...FIELD_INPUT, marginTop: 8, width: "100%", fontSize: 18 }}
        />
        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 10,
          }}
        >
          <div style={SECTION_LABEL}>DESCRIPTION</div>
          <div style={{ fontSize: 11, color: description.length > 260 ? "#8A3B1E" : "#8A7466" }}>
            {description.length}/280
          </div>
        </div>
        <textarea
          value={description}
          disabled={readOnly}
          maxLength={280}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="disabled:opacity-60"
          style={{
            marginTop: 8,
            width: "100%",
            border: "1px solid rgba(74,38,22,.2)",
            borderRadius: 10,
            background: "#FFFFFF",
            padding: 12,
            fontSize: 16,
            color: "#24150D",
            resize: "vertical",
            outline: "none",
          }}
        />
        <div style={{ height: 8, borderBottom: "1px solid rgba(74,38,22,.1)" }} />
        {drop.status === "live" && (
          <div style={ROW}>
            <span style={{ fontWeight: 500 }}>Orders open</span>
            <Toggle on={isOpen} onClick={() => setIsOpen(!isOpen)} />
          </div>
        )}
        <div style={ROW}>
          <div>
            <div style={{ fontWeight: 500 }}>Ordering deadline</div>
            <div style={{ fontSize: 12, color: deadlinePast ? "#8A3B1E" : "#6E5546", marginTop: 2 }}>
              {deadlineDays === 0 ? "Day of first pickup" : `${deadlineDays} day${deadlineDays === 1 ? "" : "s"} before first pickup`}
              {" · "}
              {deadlinePast ? "already passed — move the pickup dates" : deadlineNote}
            </div>
          </div>
          <Stepper
            value={deadlineDays}
            min={0}
            max={7}
            disabled={readOnly}
            onChange={setDeadlineDays}
            decLabel="Fewer days"
            incLabel="More days"
          />
        </div>
        <div style={{ ...ROW, borderBottom: 0 }}>
          <span style={{ fontWeight: 500 }}>Maximum cookies</span>
          <Stepper
            value={capacity}
            min={capMin}
            max={480}
            step={6}
            disabled={readOnly}
            onChange={setCapacity}
            decLabel="Decrease capacity"
            incLabel="Increase capacity"
          />
        </div>
      </div>

      {/* photo */}
      <div style={{ background: "#FBF8F1", borderRadius: 16, padding: "16px 18px" }}>
        <div style={SECTION_LABEL}>PHOTO</div>
        <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.5, color: "#6E5546" }}>
          Shown on the website next to this week&apos;s cookie. A close, warm shot works best.
        </div>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          {drop.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={drop.photoUrl}
              alt="This drop's photo"
              style={{
                width: 132,
                height: 132,
                objectFit: "cover",
                borderRadius: 12,
                border: "1px solid rgba(74,38,22,.2)",
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                width: 132,
                height: 132,
                borderRadius: 12,
                border: "1px dashed rgba(74,38,22,.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                letterSpacing: ".14em",
                color: "#8A7466",
                textAlign: "center",
                padding: 10,
              }}
            >
              NO PHOTO YET
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={(e) => onPhotoPicked(e.target.files?.[0])}
            />
            <button
              disabled={readOnly || photoBusy}
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer disabled:opacity-50"
              style={{
                height: 46,
                padding: "0 18px",
                borderRadius: 12,
                border: "1px solid #4A2616",
                background: "transparent",
                color: "#24150D",
                fontSize: 11,
                letterSpacing: ".16em",
                fontWeight: 600,
              }}
            >
              {photoBusy ? "UPLOADING…" : drop.photoUrl ? "REPLACE PHOTO" : "UPLOAD PHOTO"}
            </button>
            {drop.photoUrl && (
              <button
                disabled={readOnly || photoBusy}
                onClick={onPhotoRemove}
                className="cursor-pointer border-0 bg-transparent disabled:opacity-50"
                style={{ fontSize: 11, letterSpacing: ".14em", color: "#8A3B1E", padding: "6px 0", textAlign: "left" }}
              >
                REMOVE
              </button>
            )}
          </div>
        </div>
      </div>

      {/* pickup days */}
      <div style={{ background: "#FBF8F1", borderRadius: 16, padding: "16px 18px" }}>
        <div style={SECTION_LABEL}>PICKUP DAYS</div>
        <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.5, color: "#6E5546" }}>
          Pick a day, then add its time windows. Customers choose one window at checkout; mark a
          window full to stop new orders for it.
        </div>

        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          {dayDates.map((date) => (
            <div
              key={date}
              style={{
                border: "1px solid rgba(74,38,22,.15)",
                borderRadius: 12,
                padding: "12px 12px 10px",
                background: "#F5EFE4",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <DatePicker
                  value={date}
                  min={minPickupDate}
                  disabled={readOnly}
                  onChange={(iso) => changeDayDate(date, iso)}
                />
                <button
                  disabled={readOnly}
                  onClick={() => removeDay(date)}
                  aria-label="Remove this day"
                  className="cursor-pointer disabled:opacity-40"
                  style={{
                    flex: "0 0 44px",
                    height: 44,
                    borderRadius: 10,
                    border: "1px solid rgba(74,38,22,.2)",
                    background: "#FFFFFF",
                    color: "#4A2616",
                    fontSize: 20,
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                {winsFor(date).map(({ w, i }) => (
                  <div
                    key={w.id ?? `new-${i}`}
                    style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, paddingLeft: 10 }}
                  >
                    <div style={{ flex: "1 1 190px", display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                      <input
                        type="time"
                        value={w.starts}
                        disabled={readOnly}
                        onChange={(e) => updateWin(i, { starts: e.target.value })}
                        className="disabled:opacity-60"
                        style={{ ...FIELD_INPUT, flex: 1, minWidth: 0 }}
                      />
                      <span style={{ color: "#6E5546" }}>–</span>
                      <input
                        type="time"
                        value={w.ends}
                        disabled={readOnly}
                        onChange={(e) => updateWin(i, { ends: e.target.value })}
                        className="disabled:opacity-60"
                        style={{ ...FIELD_INPUT, flex: 1, minWidth: 0 }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                      <button
                        disabled={readOnly}
                        onClick={() => updateWin(i, { full: !w.full })}
                        className="cursor-pointer disabled:opacity-60"
                        style={{
                          height: 44,
                          minWidth: 74,
                          padding: "0 12px",
                          borderRadius: 10,
                          border: `1px solid ${w.full ? "#24150D" : "rgba(74,38,22,.25)"}`,
                          background: w.full ? "#24150D" : "#FFFFFF",
                          color: w.full ? "#F5EFE4" : "#24150D",
                          fontSize: 11,
                          letterSpacing: ".14em",
                          fontWeight: 600,
                        }}
                      >
                        {w.full ? "FULL" : "OPEN"}
                      </button>
                      <button
                        disabled={readOnly}
                        onClick={() => removeWindow(i)}
                        aria-label="Remove time window"
                        className="cursor-pointer disabled:opacity-40"
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          border: "1px solid rgba(74,38,22,.2)",
                          background: "#FFFFFF",
                          color: "#4A2616",
                          fontSize: 18,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {!readOnly && (
                <button
                  onClick={() => addTime(date)}
                  className="cursor-pointer"
                  style={{
                    marginTop: 10,
                    marginLeft: 10,
                    height: 40,
                    padding: "0 16px",
                    border: "1px dashed rgba(74,38,22,.4)",
                    borderRadius: 10,
                    background: "transparent",
                    color: "#4A2616",
                    fontSize: 11,
                    letterSpacing: ".16em",
                    fontWeight: 600,
                  }}
                >
                  + ADD TIME
                </button>
              )}
            </div>
          ))}
        </div>

        {!readOnly && (
          <button
            onClick={addDay}
            className="cursor-pointer"
            style={{
              marginTop: 12,
              width: "100%",
              height: 50,
              border: "1px dashed rgba(74,38,22,.45)",
              borderRadius: 12,
              background: "transparent",
              color: "#24150D",
              fontSize: 12,
              letterSpacing: ".18em",
              fontWeight: 600,
            }}
          >
            + ADD PICKUP DAY
          </button>
        )}
      </div>

      {/* packages */}
      <div style={{ background: "#FBF8F1", borderRadius: 16, padding: "16px 18px 6px" }}>
        <div style={SECTION_LABEL}>AVAILABLE PACKAGE SIZES</div>
        {pkgs.map((p, i) => (
          <div
            key={p.kind}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              minHeight: 68,
              borderBottom: i < pkgs.length - 1 ? "1px solid rgba(74,38,22,.1)" : 0,
            }}
          >
            <Toggle
              on={p.enabled}
              disabled={readOnly}
              onClick={() => setPkgs(pkgs.map((x, j) => (j === i ? { ...x, enabled: !x.enabled } : x)))}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500 }}>{PACKAGE_META[p.kind].name}</div>
              <div style={{ fontSize: 13, color: "#6E5546" }}>{PACKAGE_META[p.kind].sub}</div>
            </div>
            <div
              style={{
                flex: "0 0 auto",
                display: "flex",
                alignItems: "center",
                gap: 4,
                height: 44,
                border: "1px solid rgba(74,38,22,.2)",
                borderRadius: 10,
                background: "#FFFFFF",
                padding: "0 10px",
              }}
            >
              <span style={{ color: "#6E5546" }}>$</span>
              <input
                value={p.priceCents / 100}
                inputMode="numeric"
                disabled={readOnly || !p.enabled}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  const dollars = Math.min(1000, Number(digits || 0));
                  setPkgs(pkgs.map((x, j) => (j === i ? { ...x, priceCents: dollars * 100 } : x)));
                }}
                className="disabled:opacity-60"
                style={{ width: 40, border: 0, outline: "none", fontSize: 16, color: "#24150D", background: "transparent" }}
              />
            </div>
          </div>
        ))}
      </div>

      {actions.map((bt) => (
        <button
          key={bt.label}
          disabled={pending}
          onClick={bt.onClick}
          className="cursor-pointer disabled:opacity-60"
          style={{
            height: 58,
            border: "1px solid #24150D",
            borderRadius: 14,
            background: bt.bg,
            color: bt.color,
            fontSize: 13,
            letterSpacing: ".2em",
            fontWeight: 600,
          }}
        >
          {pending ? "WORKING…" : bt.label}
        </button>
      ))}

      {drop.status !== "live" && (
        <button
          disabled={pending}
          onClick={onDelete}
          onBlur={() => setConfirmDelete(false)}
          className="cursor-pointer disabled:opacity-60"
          style={{
            height: 54,
            border: `1px solid ${confirmDelete ? "#8A3B1E" : "rgba(138,59,30,.45)"}`,
            borderRadius: 14,
            background: confirmDelete ? "#8A3B1E" : "transparent",
            color: confirmDelete ? "#F5EFE4" : "#8A3B1E",
            fontSize: 12,
            letterSpacing: ".2em",
            fontWeight: 600,
            transition: "background .25s,color .25s,border-color .25s",
          }}
        >
          {pending ? "WORKING…" : confirmDelete ? "TAP AGAIN TO DELETE FOREVER" : "DELETE THIS DROP"}
        </button>
      )}
    </main>
  );
}
