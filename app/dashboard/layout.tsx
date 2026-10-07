import Image from "next/image";
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
      <div className="min-h-screen bg-cream-sunk pb-28">
        <header className="mx-auto flex max-w-[760px] items-center justify-between px-5 pt-6">
          <div>
            <p className="eyebrow text-muted-2" style={{ fontSize: "9.5px" }}>
              {todayLabel()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <form action={signOut}>
              <button className="eyebrow text-muted-2 transition-colors hover:text-brown" style={{ fontSize: "9px" }}>
                Sign out
              </button>
            </form>
            <Image src="/logo.png" alt="Manna Cookies & Co." width={48} height={48} />
          </div>
        </header>
        <div className="mx-auto max-w-[760px] px-5">{children}</div>
        <TabBar newOrders={count ?? 0} />
      </div>
    </ToastProvider>
  );
}
