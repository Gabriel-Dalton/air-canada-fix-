import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
  const model = process.env.AC_COPILOT_MODEL ?? "claude-sonnet-4-6";
  return NextResponse.json({
    ok: hasKey,
    has_anthropic_key: hasKey,
    model,
    setup_hint: hasKey
      ? null
      : "Copy .env.example to .env.local and add ANTHROPIC_API_KEY from https://console.anthropic.com/, then restart `npm run dev`.",
  });
}
