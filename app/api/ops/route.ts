import { NextResponse } from "next/server";
import { seedIfNeeded } from "@/lib/seed";
import { store } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  seedIfNeeded();
  return NextResponse.json({
    sessions: store.all(),
    flagged: store.flagged(),
    by_module: store.byModule(),
    top_topics: store.topTopics(),
    resolution: store.resolutionMetrics(),
    volume_24h: store.volumeBuckets(24),
    fetched_at: Date.now(),
  });
}
