import Image from "next/image";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import TabBar from "@/components/dashboard/TabBar";
import ToastProvider from "@/components/dashboard/Toast";
import { signOut } from "@/app/login/actions";

export const metadata = { title: "Owner Dashboard · Manna Cookies & Co.", robots: { index: false } };

function todayLabel() {
  return `MANNA · ${new Date()
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: "America/New_York",
    })
    .toUpperCase()}`;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await connection();
  let supabase;
  try {
    ({ supabase } = await requireOwner());
  } catch {
    redirect("/login");
  }

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
            padding: "22px 18px 6px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 11, letterSpacing: ".24em", fontWeight: 500, color: "#8A6440" }}>
            {todayLabel()}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <form action={signOut}>
              <button
                className="cursor-pointer border-0 bg-transparent"
                style={{ fontSize: 10, letterSpacing: ".2em", color: "#8A7466", fontWeight: 500 }}
              >
                SIGN OUT
              </button>
            </form>
            <Image
              src="/logo.png"
              alt="Manna"
              width={48}
              height={48}
              style={{ width: 48, height: 48, display: "block" }}
            />
          </div>
        </header>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 18px" }}>{children}</div>
        <TabBar newOrders={count ?? 0} />
      </div>
    </ToastProvider>
  );
}
