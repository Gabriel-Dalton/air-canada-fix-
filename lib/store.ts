// In-memory session store for the Ops dashboard demo. Production deployment
// would replace this with a real DB (Postgres/Redis) and an event bus.

export type SkillModule =
  | "disruption"
  | "baggage"
  | "aeroplan"
  | "rebooking"
  | "general";

export type Sentiment = "calm" | "frustrated" | "rage";

export interface UrgencyFlag {
  reason: string;
  severity: "low" | "medium" | "high";
  flagged_at: number;
}

export interface SessionRecord {
  id: string;
  started_at: number;
  ended_at?: number;
  module: SkillModule;
  sentiment: Sentiment;
  message_count: number;
  resolved_by_ai: boolean;
  flag?: UrgencyFlag;
  preview: string; // last user message, trimmed
  topic_tag?: string; // e.g. "delay-compensation", "lost-bag", "status-fast-track"
}

class Store {
  private sessions = new Map<string, SessionRecord>();

  upsert(record: SessionRecord) {
    this.sessions.set(record.id, record);
  }

  patch(id: string, partial: Partial<SessionRecord>) {
    const existing = this.sessions.get(id);
    if (!existing) return;
    this.sessions.set(id, { ...existing, ...partial });
  }

  get(id: string): SessionRecord | undefined {
    return this.sessions.get(id);
  }

  all(): SessionRecord[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => b.started_at - a.started_at,
    );
  }

  flagged(): SessionRecord[] {
    return this.all().filter((s) => s.flag);
  }

  byModule(): Record<SkillModule, number> {
    const counts: Record<SkillModule, number> = {
      disruption: 0,
      baggage: 0,
      aeroplan: 0,
      rebooking: 0,
      general: 0,
    };
    for (const s of this.sessions.values()) counts[s.module] += 1;
    return counts;
  }

  topTopics(): { tag: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const s of this.sessions.values()) {
      if (!s.topic_tag) continue;
      counts.set(s.topic_tag, (counts.get(s.topic_tag) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }

  // Resolution metric: average message count for AI-resolved vs handed-off.
  resolutionMetrics(): {
    ai_only_count: number;
    handoff_count: number;
    avg_messages_ai: number;
    avg_messages_handoff: number;
  } {
    let aiCount = 0;
    let aiMsgSum = 0;
    let handoffCount = 0;
    let handoffMsgSum = 0;
    for (const s of this.sessions.values()) {
      if (s.flag) {
        handoffCount += 1;
        handoffMsgSum += s.message_count;
      } else if (s.resolved_by_ai) {
        aiCount += 1;
        aiMsgSum += s.message_count;
      }
    }
    return {
      ai_only_count: aiCount,
      handoff_count: handoffCount,
      avg_messages_ai: aiCount === 0 ? 0 : Math.round((aiMsgSum / aiCount) * 10) / 10,
      avg_messages_handoff:
        handoffCount === 0 ? 0 : Math.round((handoffMsgSum / handoffCount) * 10) / 10,
    };
  }

  // Volume over the last N hours, bucketed per hour.
  volumeBuckets(hours = 24): { hour: number; count: number }[] {
    const now = Date.now();
    const buckets = Array.from({ length: hours }, (_, i) => ({
      hour: hours - 1 - i,
      count: 0,
    }));
    for (const s of this.sessions.values()) {
      const ageMs = now - s.started_at;
      const ageHours = Math.floor(ageMs / (60 * 60 * 1000));
      if (ageHours < 0 || ageHours >= hours) continue;
      const bucketIdx = hours - 1 - ageHours;
      buckets[bucketIdx]!.count += 1;
    }
    return buckets;
  }
}

// Module-scoped singleton — Next.js dev mode hot-reloads modules, so cache on
// globalThis to survive HMR.
declare global {
  // eslint-disable-next-line no-var
  var __ac_store: Store | undefined;
}

export const store: Store = (globalThis.__ac_store ??= new Store());
