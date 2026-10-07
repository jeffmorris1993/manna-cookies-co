import { requireOwner } from "@/lib/auth";

export default async function DashboardHome() {
  await requireOwner();
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-sunk">
      <p className="eyebrow text-muted">Dashboard shell — Phase 6 in progress</p>
    </main>
  );
}
