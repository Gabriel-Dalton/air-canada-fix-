"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CitedText } from "./Citation";
import { ToolCard } from "./Cards";
import { ModuleBadge } from "./ModuleBadge";
import type { SkillModule } from "@/lib/store";

type AssistantBlock =
  | { kind: "text"; text: string }
  | {
      kind: "card";
      tool_name: string;
      module: SkillModule;
      card: { kind: string; data: Record<string, unknown> };
    };

interface UiMessage {
  id: string;
  role: "user" | "assistant";
  blocks: AssistantBlock[];
  module?: SkillModule;
  flag?: { reason: string; severity: "low" | "medium" | "high" };
}

interface UsageTotals {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
}

const STARTERS = [
  {
    label: "Disruption: cancelled flight",
    text: "AC456 from YYZ to LHR was cancelled 5 hours before departure due to crew scheduling. What am I owed?",
  },
  {
    label: "Baggage: bag delayed in Paris",
    text: "My bag (file YYZ12345) is 3 days late and I'm in Paris. What can I claim?",
  },
  {
    label: "Aeroplan: status fast-track",
    text: "I'm Aeroplan member 9000001 and want to hit 50K this year. What's the cheapest path?",
  },
  {
    label: "Rebooking: AC872 cancelled",
    text: "AC872 to FRA just cancelled and I have a meeting tomorrow at 2pm. What are my rebooking options?",
  },
];

function newSessionId() {
  return `sess-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function newMsgId() {
  return `msg-${Math.random().toString(36).slice(2, 10)}`;
}

export function Chat() {
  const [sessionId] = useState(newSessionId);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageTotals>({
    input_tokens: 0,
    output_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || busy) return;
      setError(null);

      const userMsg: UiMessage = {
        id: newMsgId(),
        role: "user",
        blocks: [{ kind: "text", text }],
      };
      const assistantMsg: UiMessage = {
        id: newMsgId(),
        role: "assistant",
        blocks: [{ kind: "text", text: "" }],
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setBusy(true);

      // Build the API payload from prior messages + the new user turn.
      const apiMessages = [
        ...messages
          .filter((m) => m.blocks.length > 0)
          .map((m) => {
            if (m.role === "user") {
              const t = m.blocks
                .filter((b): b is { kind: "text"; text: string } => b.kind === "text")
                .map((b) => b.text)
                .join("\n");
              return { role: "user" as const, content: t };
            }
            // Send back assistant text only — tool_use blocks would have to be
            // sent verbatim with their original IDs, which we don't preserve
            // client-side. The model uses surrounding text + the user's next
            // message as context. Good enough for a demo.
            const t = m.blocks
              .filter((b): b is { kind: "text"; text: string } => b.kind === "text")
              .map((b) => b.text)
              .join("\n");
            return { role: "assistant" as const, content: t || "(tool calls)" };
          }),
        { role: "user" as const, content: text },
      ];

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId, messages: apiMessages }),
        });
        if (!res.ok || !res.body) {
          throw new Error(`API error: ${res.status}`);
        }
        await consumeSse(res.body, {
          onText: (delta) => {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (!last || last.role !== "assistant") return prev;
              const lastBlock = last.blocks[last.blocks.length - 1];
              if (lastBlock && lastBlock.kind === "text") {
                lastBlock.text += delta;
              } else {
                last.blocks.push({ kind: "text", text: delta });
              }
              return next;
            });
          },
          onCard: (payload) => {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (!last || last.role !== "assistant") return prev;
              last.blocks.push({
                kind: "card",
                tool_name: payload.tool_name,
                module: payload.module,
                card: payload.card,
              });
              // Make sure there's a fresh empty text block to receive the
              // model's post-tool reply.
              last.blocks.push({ kind: "text", text: "" });
              return next;
            });
          },
          onModule: (m) => {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (!last || last.role !== "assistant") return prev;
              last.module = m;
              return next;
            });
          },
          onHandoff: (flag) => {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (!last || last.role !== "assistant") return prev;
              last.flag = flag;
              return next;
            });
          },
          onUsage: (u) => {
            setUsage((prev) => ({
              input_tokens: prev.input_tokens + u.input_tokens,
              output_tokens: prev.output_tokens + u.output_tokens,
              cache_creation_input_tokens:
                prev.cache_creation_input_tokens + u.cache_creation_input_tokens,
              cache_read_input_tokens:
                prev.cache_read_input_tokens + u.cache_read_input_tokens,
            }));
          },
          onError: (msg) => setError(msg),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Request failed.");
      } finally {
        setBusy(false);
      }
    },
    [busy, messages, sessionId],
  );

  return (
    <div className="flex h-full min-h-[calc(100vh-64px)] flex-col">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 ? (
            <Welcome onPick={(s) => void send(s)} starters={STARTERS} />
          ) : (
            messages.map((m) => <MessageRow key={m.id} message={m} />)
          )}
          {busy && (
            <div className="flex items-center gap-2 text-xs text-ac-muted">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-ac-red" />
              thinking…
            </div>
          )}
          {error && (
            <div className="rounded-md border border-ac-red/40 bg-ac-red/5 p-3 text-sm text-ac-red">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-ac-line bg-white">
        <div className="mx-auto flex max-w-3xl items-end gap-2 px-4 py-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder="Describe your situation — flight number, what happened, when…"
            rows={2}
            className="flex-1 resize-none rounded-lg border border-ac-line bg-white px-3 py-2 text-sm focus:border-ac-ink focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void send(input)}
            disabled={busy || !input.trim()}
            className="rounded-lg bg-ac-red px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 pb-3 text-[11px] text-ac-muted">
          <span>
            Session {sessionId.slice(0, 14)} · cite-or-refuse · grounded
          </span>
          <span title="Prompt-caching savings demonstrated via cache_read_input_tokens">
            tokens · in {usage.input_tokens} · out {usage.output_tokens} · cache read{" "}
            <span className="font-semibold text-ac-mint">
              {usage.cache_read_input_tokens.toLocaleString()}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

function Welcome({
  starters,
  onPick,
}: {
  starters: { label: string; text: string }[];
  onPick: (text: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <div className="font-serif text-3xl font-bold text-ac-ink">
          How can the Care Copilot help?
        </div>
        <div className="mt-2 max-w-2xl text-sm leading-relaxed text-ac-muted">
          One assistant, four skill modules — Disruption &amp; APPR, Baggage,
          Aeroplan, and Rebooking. Every factual claim is anchored to a specific
          policy clause. If a question can&apos;t be cited, the assistant
          declines and offers a human handoff.
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {starters.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onPick(s.text)}
            className="group rounded-xl border border-ac-line bg-white p-4 text-left transition hover:border-ac-ink"
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ac-muted">
              {s.label}
            </div>
            <div className="mt-1 text-sm leading-relaxed text-ac-ink/90">
              {s.text}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageRow({ message }: { message: UiMessage }) {
  if (message.role === "user") {
    const text = message.blocks
      .filter((b): b is { kind: "text"; text: string } => b.kind === "text")
      .map((b) => b.text)
      .join("\n");
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl bg-ac-ink px-4 py-2 text-sm text-white">
          {text}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {message.module && (
        <div className="flex items-center gap-2">
          <ModuleBadge module={message.module} />
        </div>
      )}
      <div className="rounded-2xl border border-ac-line bg-white px-4 py-3 text-sm leading-relaxed text-ac-ink">
        {message.blocks.map((b, i) => {
          if (b.kind === "text") {
            if (!b.text) return null;
            return (
              <p key={i} className="whitespace-pre-wrap [&:not(:first-child)]:mt-2">
                <CitedText text={b.text} />
              </p>
            );
          }
          return <ToolCard key={i} card={b.card} />;
        })}
      </div>
    </div>
  );
}

interface SseHandlers {
  onText: (delta: string) => void;
  onCard: (payload: {
    tool_name: string;
    module: SkillModule;
    card: { kind: string; data: Record<string, unknown> };
  }) => void;
  onModule: (m: SkillModule) => void;
  onHandoff: (flag: { reason: string; severity: "low" | "medium" | "high" }) => void;
  onUsage: (u: UsageTotals) => void;
  onError: (msg: string) => void;
}

async function consumeSse(body: ReadableStream<Uint8Array>, h: SseHandlers) {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const raw = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const lines = raw.split("\n");
      let event = "message";
      let data = "";
      for (const line of lines) {
        if (line.startsWith("event: ")) event = line.slice(7).trim();
        else if (line.startsWith("data: ")) data += line.slice(6);
      }
      if (!data) continue;
      try {
        const parsed = JSON.parse(data) as Record<string, unknown>;
        switch (event) {
          case "text":
            h.onText(String(parsed.delta ?? ""));
            break;
          case "card":
            h.onCard(parsed as never);
            break;
          case "module":
            h.onModule(parsed.module as SkillModule);
            break;
          case "handoff":
            h.onHandoff(parsed as never);
            break;
          case "usage":
            h.onUsage(parsed as never);
            break;
          case "error":
            h.onError(String(parsed.message ?? "Unknown error."));
            break;
          case "done":
            return;
        }
      } catch {
        // ignore parse errors on heartbeat / partial frames
      }
    }
  }
}
