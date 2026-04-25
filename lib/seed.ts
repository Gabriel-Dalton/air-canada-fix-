import { store, type SessionRecord } from "./store";

// Realistic seeded transcripts so /ops looks alive on first load. Demo data
// only — production would feed from real conversation logs.

const HOUR = 60 * 60 * 1000;
const now = Date.now();

const seeds: SessionRecord[] = [
  {
    id: "sess-seed-001",
    started_at: now - 22 * HOUR,
    ended_at: now - 22 * HOUR + 4 * 60 * 1000,
    module: "disruption",
    sentiment: "frustrated",
    message_count: 6,
    resolved_by_ai: true,
    preview:
      "AC456 cancelled 5 hours before departure, told it was crew scheduling. What am I owed?",
    topic_tag: "delay-compensation",
  },
  {
    id: "sess-seed-002",
    started_at: now - 19 * HOUR,
    ended_at: now - 19 * HOUR + 7 * 60 * 1000,
    module: "baggage",
    sentiment: "frustrated",
    message_count: 8,
    resolved_by_ai: true,
    preview:
      "Bag YYZ12345 still missing 3 days. I'm in Paris with no clothes. Reference confirms last seen at FRA.",
    topic_tag: "delayed-bag-interim-allowance",
  },
  {
    id: "sess-seed-003",
    started_at: now - 16 * HOUR,
    ended_at: now - 16 * HOUR + 12 * 60 * 1000,
    module: "disruption",
    sentiment: "rage",
    message_count: 11,
    resolved_by_ai: false,
    flag: {
      reason: "Stranded with sick infant overnight; sustained anger; needs immediate live agent.",
      severity: "high",
      flagged_at: now - 16 * HOUR + 6 * 60 * 1000,
    },
    preview:
      "I have been on hold for 4 hours with a 9 month old. This is unacceptable.",
    topic_tag: "stranded-overnight",
  },
  {
    id: "sess-seed-004",
    started_at: now - 13 * HOUR,
    ended_at: now - 13 * HOUR + 5 * 60 * 1000,
    module: "aeroplan",
    sentiment: "calm",
    message_count: 5,
    resolved_by_ai: true,
    preview:
      "I'm at 28K SQM and 3500 SQD. Want to hit 50K by year end — what's the cheapest path?",
    topic_tag: "status-fast-track",
  },
  {
    id: "sess-seed-005",
    started_at: now - 10 * HOUR,
    ended_at: now - 10 * HOUR + 3 * 60 * 1000,
    module: "rebooking",
    sentiment: "frustrated",
    message_count: 4,
    resolved_by_ai: true,
    preview:
      "AC872 to FRA was just cancelled. Need to be in Frankfurt by tomorrow afternoon for a meeting.",
    topic_tag: "rebooking-9hr-window",
  },
  {
    id: "sess-seed-006",
    started_at: now - 8 * HOUR,
    ended_at: now - 8 * HOUR + 9 * 60 * 1000,
    module: "disruption",
    sentiment: "frustrated",
    message_count: 7,
    resolved_by_ai: true,
    preview:
      "Air Canada says my AC456 delay was 'safety related' and they won't pay. How do I challenge that?",
    topic_tag: "cause-category-dispute",
  },
  {
    id: "sess-seed-007",
    started_at: now - 6 * HOUR,
    ended_at: now - 6 * HOUR + 4 * 60 * 1000,
    module: "baggage",
    sentiment: "calm",
    message_count: 4,
    resolved_by_ai: true,
    preview: "Bag is back. How do I file for the new clothes I had to buy?",
    topic_tag: "delayed-bag-interim-allowance",
  },
  {
    id: "sess-seed-008",
    started_at: now - 4 * HOUR,
    ended_at: now - 4 * HOUR + 11 * 60 * 1000,
    module: "disruption",
    sentiment: "rage",
    message_count: 14,
    resolved_by_ai: false,
    flag: {
      reason: "Missed wedding due to disruption; threatening media; high-severity escalation.",
      severity: "high",
      flagged_at: now - 4 * HOUR + 3 * 60 * 1000,
    },
    preview:
      "I MISSED MY OWN WEDDING. I am calling the news tomorrow if no one talks to me.",
    topic_tag: "missed-event-claim",
  },
  {
    id: "sess-seed-009",
    started_at: now - 2 * HOUR,
    ended_at: now - 2 * HOUR + 3 * 60 * 1000,
    module: "aeroplan",
    sentiment: "calm",
    message_count: 4,
    resolved_by_ai: true,
    preview: "Best use of 110K Aeroplan points to Asia in business?",
    topic_tag: "redemption-sweet-spot",
  },
  {
    id: "sess-seed-010",
    started_at: now - 1 * HOUR,
    ended_at: now - 1 * HOUR + 2 * 60 * 1000,
    module: "rebooking",
    sentiment: "frustrated",
    message_count: 3,
    resolved_by_ai: true,
    preview:
      "Cancellation just announced for AC848 to LHR. Weather, they say. What are my rights?",
    topic_tag: "outside-control-rebooking",
  },
];

let _seeded = false;
export function seedIfNeeded() {
  if (_seeded) return;
  _seeded = true;
  for (const s of seeds) store.upsert(s);
}
