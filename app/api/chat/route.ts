import type Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { getClient, MODEL } from "@/lib/anthropic";
import { KNOWLEDGE_BLOCK, SYSTEM_RULES } from "@/lib/prompts";
import { runTool, TOOLS, type ToolOutcome } from "@/lib/tools";
import { store, type SkillModule } from "@/lib/store";
import { seedIfNeeded } from "@/lib/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatRequest {
  session_id: string;
  messages: Anthropic.MessageParam[];
}

// Naive sentiment heuristic for the Ops dashboard — production deployment
// would use a sentiment classifier. Demo-only.
function detectSentiment(text: string): "calm" | "frustrated" | "rage" {
  const lower = text.toLowerCase();
  const rageMarkers = [
    "fucking",
    "ridiculous",
    "unacceptable",
    "calling the news",
    "lawyer",
    "sue",
    "trash",
    "garbage",
    "worst",
    "missed my wedding",
    "missed my funeral",
    "stranded",
    "hours on hold",
  ];
  const frustratedMarkers = [
    "frustrated",
    "annoyed",
    "wtf",
    "joke",
    "useless",
    "delay",
    "cancelled",
    "lost",
    "still missing",
  ];
  if (rageMarkers.some((m) => lower.includes(m))) return "rage";
  if (frustratedMarkers.some((m) => lower.includes(m))) return "frustrated";
  return "calm";
}

export async function POST(req: NextRequest) {
  seedIfNeeded();

  const body = (await req.json()) as ChatRequest;
  const { session_id, messages } = body;

  if (!session_id || !Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "Bad request: session_id and messages required." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const lastUserText =
    typeof lastUser?.content === "string"
      ? lastUser.content
      : Array.isArray(lastUser?.content)
        ? lastUser.content
            .filter((b) => b.type === "text")
            .map((b) => (b as { text: string }).text)
            .join(" ")
        : "";

  const sentiment = detectSentiment(lastUserText);
  const userMsgCount = messages.filter((m) => m.role === "user").length;

  // Upsert the session record up-front so it shows in /ops in real time.
  store.upsert({
    id: session_id,
    started_at: store.get(session_id)?.started_at ?? Date.now(),
    module: store.get(session_id)?.module ?? "general",
    sentiment:
      sentiment === "rage"
        ? "rage"
        : sentiment === "frustrated" || store.get(session_id)?.sentiment === "frustrated"
          ? "frustrated"
          : "calm",
    message_count: userMsgCount,
    resolved_by_ai: store.get(session_id)?.resolved_by_ai ?? true,
    flag: store.get(session_id)?.flag,
    preview: lastUserText.slice(0, 240),
    topic_tag: store.get(session_id)?.topic_tag,
  });

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      try {
        await runAgentLoop({
          messages,
          sessionId: session_id,
          send,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown server error.";
        send("error", { message });
      } finally {
        send("done", {});
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

async function runAgentLoop(opts: {
  messages: Anthropic.MessageParam[];
  sessionId: string;
  send: (event: string, data: unknown) => void;
}) {
  const client = getClient();
  let messages = [...opts.messages];

  // Run the manual agentic loop. We use streaming so the user sees text arrive
  // token-by-token between tool calls. Cap iterations at 6 to defend against
  // runaway loops.
  for (let iter = 0; iter < 6; iter++) {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 4096,
      system: [
        // First cache breakpoint — covers system rules and the knowledge block.
        // This is the bulk of every request; caching it is the single biggest
        // cost lever.
        { type: "text", text: SYSTEM_RULES },
        {
          type: "text",
          text: KNOWLEDGE_BLOCK,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: TOOLS,
      messages,
    });

    stream.on("text", (delta) => {
      opts.send("text", { delta });
    });

    const message = await stream.finalMessage();

    // Surface module + topic_tag for any tool calls in this turn so the
    // frontend can render them progressively.
    const toolUses = message.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );

    // Surface usage so we can demonstrate prompt-caching savings in the demo.
    opts.send("usage", {
      input_tokens: message.usage.input_tokens,
      output_tokens: message.usage.output_tokens,
      cache_creation_input_tokens: message.usage.cache_creation_input_tokens ?? 0,
      cache_read_input_tokens: message.usage.cache_read_input_tokens ?? 0,
    });

    if (message.stop_reason === "end_turn" || toolUses.length === 0) {
      // Done.
      const existing = store.get(opts.sessionId);
      store.patch(opts.sessionId, {
        message_count: (existing?.message_count ?? 0) + 1,
      });
      return;
    }

    // Echo the assistant turn (must include tool_use blocks verbatim).
    messages.push({ role: "assistant", content: message.content });

    // Execute each tool, feed results back, and push them as cards to the UI.
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      const outcome: ToolOutcome = runTool(
        tu.name,
        (tu.input as Record<string, unknown>) ?? {},
        { sessionId: opts.sessionId },
      );

      // Persist module + topic_tag on the session record.
      const existing = store.get(opts.sessionId);
      store.patch(opts.sessionId, {
        module: outcome.module as SkillModule,
        topic_tag: outcome.topic_tag ?? existing?.topic_tag,
        resolved_by_ai: outcome.flag ? false : existing?.resolved_by_ai ?? true,
      });

      // Push the card to the UI.
      if (outcome.card) {
        opts.send("card", {
          tool_name: tu.name,
          module: outcome.module,
          card: outcome.card,
        });
      }
      if (outcome.flag) {
        opts.send("handoff", outcome.flag);
      }
      opts.send("module", { module: outcome.module });

      toolResults.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content: outcome.result,
      });
    }

    messages.push({ role: "user", content: toolResults });
  }

  // Loop budget exhausted. Emit a polite cap message so the UI doesn't spin.
  opts.send("text", {
    delta:
      "\n\n(Reached internal tool-call limit for this turn. Ask me to continue if you'd like more.)",
  });
}
