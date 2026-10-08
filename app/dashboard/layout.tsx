import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requireOwner, ownerName } from "@/lib/auth";
import TabBar from "@/components/dashboard/TabBar";
import ToastProvider from "@/components/dashboard/Toast";
import AutoRefresh from "@/components/dashboard/AutoRefresh";
import { signOut } from "@/app/login/actions";

export const metadata = { title: "Owner Dashboard · Manna Cookies & Co.", robots: { index: false } };

function todayLabel() {
  return new Date()
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: "America/New_York",
    })
    .toUpperCase();
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await connection();
  let supabase;
  let user;
  try {
    ({ supabase, user } = await requireOwner());
  } catch {
    redirect("/login");
  }
  const firstName = ownerName(user.email);

  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");

  return (
    <ToastProvider>
      <div
        style={{
          minHeight: "100svh",
          background: "#F2EBDF",
          color: "#24150D",
          fontSize: 15,
          paddingBottom: 110,
        }}
      >
        <header
          style={{
            maxWidth: 760,
            margin: "0 auto",
            padding: "20px 18px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Image
            src="/logo.png"
            alt="Manna Cookies & Co."
            width={42}
            height={42}
            style={{ width: 42, height: 42, display: "block", flex: "0 0 auto" }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 5,
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: ".22em",
                fontWeight: 500,
                color: "#8A6440",
                whiteSpace: "nowrap",
              }}
            >
              {todayLabel()}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link
                href="/"
                style={{ fontSize: 9, letterSpacing: ".18em", color: "#8A7466", fontWeight: 600 }}
              >
                VIEW SITE
              </Link>
              <span aria-hidden style={{ fontSize: 9, color: "#C9B8A6" }}>
                ·
              </span>
              <form action={signOut} style={{ display: "flex" }}>
                <button
                  className="cursor-pointer border-0 bg-transparent"
                  style={{ fontSize: 9, letterSpacing: ".18em", color: "#8A7466", fontWeight: 600, padding: 0 }}
                >
                  SIGN OUT
                </button>
              </form>
            </div>
          </div>
        </header>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "16px 18px 2px" }}>
          <div
            className="font-display"
            style={{ fontSize: "clamp(22px,5.6vw,28px)", lineHeight: 1.15, color: "#24150D" }}
          >
            Let&apos;s get baking, <span style={{ fontStyle: "italic" }}>{firstName}</span>.
          </div>
        </div>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 18px" }}>{children}</div>
        <TabBar newOrders={count ?? 0} />
        <AutoRefresh />
      </div>
    </ToastProvider>
  );
}
