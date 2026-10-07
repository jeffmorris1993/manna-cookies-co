import { connection } from "next/server";
import PublicSite from "@/components/public/PublicSite";
import ClosedSite from "@/components/public/ClosedSite";
import { getLiveDropView } from "@/lib/live-drop";

export default async function Home() {
  await connection(); // always render with live availability
  const drop = await getLiveDropView();

  if (!drop) {
    // No live drop — branded closed state with a waitlist
    return <ClosedSite />;
  }

  return <PublicSite drop={drop} />;
}
