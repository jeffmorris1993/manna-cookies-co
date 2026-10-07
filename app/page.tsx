import { connection } from "next/server";
import PublicSite from "@/components/public/PublicSite";
import { getLiveDropView } from "@/lib/live-drop";

export default async function Home() {
  await connection(); // always render with live availability
  const drop = await getLiveDropView();

  if (!drop) {
    // No live drop configured — quiet closed state
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 text-center">
        <h1 className="font-display text-4xl text-ink">Manna Cookies &amp; Co.</h1>
        <p className="mt-4 font-display italic text-brown-muted">
          The oven is resting. Check back soon.
        </p>
      </main>
    );
  }

  return <PublicSite drop={drop} />;
}
