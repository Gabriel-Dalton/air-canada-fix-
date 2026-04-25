"use client";

import { useEffect, useState } from "react";
import type { SessionRecord, SkillModule } from "@/lib/store";
import { ModuleBadge } from "./ModuleBadge";

interface OpsPayload {
  sessions: SessionRecord[];
  flagged: SessionRecord[];
  by_module: Record<SkillModule, number>;
  top_topics: { tag: string; count: number }[];
  resolution: {
    ai_only_count: number;
    handoff_count: number;
    avg_messages_ai: number;
    avg_messages_handoff: number;
  };
  volume_24h: { hour: number; count: number }[];
  fetched_at: number;
}

export function OpsDashboard() {
  const [data, setData] = useState<OpsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/ops", { cache: "no-store" });
        if (!res.ok) throw new Error(`Ops API ${res.status}`);
        const json = (await res.json()) as OpsPayload;
        if (alive) setData(json);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Load failed.");
      }
    };
    void load();
    const t = setInterval(load, 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-5xl p-6 text-sm text-ac-red">{error}</div>
    );
  }
  if (!data) {
    return (
      <div className="mx-auto max-w-5xl p-6 text-sm text-ac-muted">
        Loading…
      </div>
    );
  }

  const totalSessions = data.sessions.length;
  const totalFlagged = data.flagged.length;
  const totalAiResolved = data.resolution.ai_only_count;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex items-end justify-between">
        <div>
          <div className="font-serif text-3xl font-bold text-ac-ink">
            Care Copilot · Ops
          </div>
          <div className="text-sm text-ac-muted">
            Live view of passenger conversations, by skill module, with rage-risk
            triage.
          </div>
        </div>
        <div className="text-[11px] uppercase tracking-wider text-ac-muted">
          Auto-refresh · 4s
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Sessions today"
          value={totalSessions}
          note={`${totalAiResolved} AI-resolved`}
        />
        <Stat
          label="Flagged for handoff"
          value={totalFlagged}
          tone={totalFlagged > 0 ? "alert" : "calm"}
          note="severity ≥ medium"
        />
        <Stat
          label="Avg msgs · AI"
          value={data.resolution.avg_messages_ai}
          note="end-to-end"
        />
        <Stat
          label="Avg msgs · handoff"
          value={data.resolution.avg_messages_handoff}
          note="before escalation"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Panel title="Volume · last 24h">
          <VolumeChart buckets={data.volume_24h} />
        </Panel>
        <Panel title="By module">
          <ModuleBars by_module={data.by_module} total={totalSessions} />
        </Panel>
        <Panel title="Top topics">
          <TopicsList items={data.top_topics} />
        </Panel>
      </section>

      <section>
        <Panel title="Rage queue · transcripts flagged for human handoff">
          {data.flagged.length === 0 ? (
            <div className="p-3 text-sm text-ac-muted">
              No flagged conversations right now.
            </div>
          ) : (
            <ul className="divide-y divide-ac-line">
              {data.flagged.map((s) => (
                <RageRow key={s.id} session={s} />
              ))}
            </ul>
          )}
        </Panel>
      </section>

      <section>
        <Panel title="All sessions">
          <ul className="divide-y divide-ac-line">
            {data.sessions.slice(0, 20).map((s) => (
              <SessionRow key={s.id} session={s} />
            ))}
          </ul>
        </Panel>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: number | string;
  note?: string;
  tone?: "alert" | "calm";
}) {
  const ring =
    tone === "alert" ? "border-ac-red/40 bg-ac-red/5" : "border-ac-line bg-white";
  return (
    <div className={`rounded-xl border p-4 ${ring}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ac-muted">
        {label}
      </div>
      <div className="mt-1 font-serif text-3xl font-bold text-ac-ink">
        {value}
      </div>
      {note && <div className="mt-0.5 text-xs text-ac-muted">{note}</div>}
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-ac-line bg-white">
      <div className="border-b border-ac-line px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-ac-muted">
        {title}
      </div>
      {children}
    </div>
  );
}

function VolumeChart({ buckets }: { buckets: { hour: number; count: number }[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div className="flex h-32 items-end gap-[2px] p-3">
      {buckets.map((b, i) => {
        const h = Math.round((b.count / max) * 100);
        return (
          <div
            key={i}
            className="flex-1"
            title={`${b.hour}h ago · ${b.count}`}
          >
            <div
              className="w-full rounded-sm bg-ac-ink/80"
              style={{ height: `${Math.max(2, h)}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

function ModuleBars({
  by_module,
  total,
}: {
  by_module: Record<SkillModule, number>;
  total: number;
}) {
  const entries = (Object.entries(by_module) as [SkillModule, number][]).sort(
    (a, b) => b[1] - a[1],
  );
  return (
    <div className="space-y-2 p-3">
      {entries.map(([mod, count]) => {
        const pct = total === 0 ? 0 : Math.round((count / total) * 100);
        return (
          <div key={mod} className="flex items-center gap-2 text-xs">
            <div className="w-32 shrink-0">
              <ModuleBadge module={mod} />
            </div>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-ac-paper">
              <div
                className="h-full rounded-full bg-ac-ink"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="w-10 shrink-0 text-right tabular-nums text-ac-muted">
              {count}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TopicsList({ items }: { items: { tag: string; count: number }[] }) {
  if (items.length === 0) {
    return <div className="p-3 text-sm text-ac-muted">No topics yet.</div>;
  }
  return (
    <ul className="divide-y divide-ac-line text-sm">
      {items.slice(0, 8).map((t) => (
        <li key={t.tag} className="flex items-center justify-between px-4 py-2">
          <span className="text-ac-ink/90">{t.tag}</span>
          <span className="rounded-full bg-ac-paper px-2 py-0.5 text-xs text-ac-muted">
            {t.count}
          </span>
        </li>
      ))}
    </ul>
  );
}

function RageRow({ session }: { session: SessionRecord }) {
  const sev = session.flag?.severity ?? "low";
  const sevStyle = {
    low: "bg-white text-ac-muted",
    medium: "bg-ac-amber/10 text-ac-amber",
    high: "bg-ac-red/10 text-ac-red",
  }[sev];
  return (
    <li className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ModuleBadge module={session.module} />
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-ac-line ${sevStyle}`}
          >
            {sev}
          </span>
        </div>
        <span className="text-[11px] text-ac-muted">
          {timeAgo(session.started_at)}
        </span>
      </div>
      <div className="mt-1 text-sm font-medium text-ac-ink">
        {session.flag?.reason}
      </div>
      <div className="mt-1 line-clamp-2 text-xs italic text-ac-muted">
        “{session.preview}”
      </div>
    </li>
  );
}

function SessionRow({ session }: { session: SessionRecord }) {
  return (
    <li className="px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ModuleBadge module={session.module} />
          <span className="text-[11px] text-ac-muted">
            {session.message_count} msg
          </span>
          {session.flag && (
            <span className="rounded-full bg-ac-red/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ac-red">
              flagged
            </span>
          )}
          {session.topic_tag && (
            <span className="rounded-full bg-ac-paper px-2 py-0.5 text-[10px] text-ac-muted">
              {session.topic_tag}
            </span>
          )}
        </div>
        <span className="text-[11px] text-ac-muted">
          {timeAgo(session.started_at)}
        </span>
      </div>
      <div className="mt-1 line-clamp-1 text-xs text-ac-ink/80">
        {session.preview}
      </div>
    </li>
  );
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}
