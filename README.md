# Air Canada Care Copilot

A grounded, citation-backed AI passenger-care copilot for Air Canada — built as a concept pitch.

> **One sentence**: a single AI assistant that diagnoses passenger rights under Canada's APPR, recovers delayed baggage under the Montreal Convention, optimizes Aeroplan status and redemptions, and generates rebooking scripts — with every claim anchored to a specific policy clause, and a CEO-facing ops dashboard that surfaces the rage-risk conversations in real time.

---

## Why this exists

In 2024, a B.C. tribunal ruled that Air Canada was legally responsible for incorrect bereavement-fare information its customer-service chatbot had given a passenger — the airline subsequently took the bot down. The episode produced a visible, named gap in Air Canada's customer experience and a credibility cost attached to the very idea of an AI assistant.

This project is the answer to that gap: an AI assistant deliberately built so the 2024 failure mode cannot recur, paired with an operations view that turns every conversation into a stream of insight for the customer-experience leadership team.

## What it does

Four skill modules under one assistant:

| Module | What it does | Tools |
|---|---|---|
| **Disruption & APPR** | Diagnoses entitlement under SOR/2019-150, calculates compensation, drafts the formal claim. | `estimate_compensation`, `draft_appr_claim_letter` |
| **Baggage** | Looks up World Tracer files, computes interim-expense allowance, drafts a delayed-baggage claim within the 21-day Montreal Convention notice window. | `lookup_baggage_status`, `estimate_baggage_allowance`, `draft_baggage_claim` |
| **Aeroplan** | Profiles a member, projects status fast-track paths against the published SQM/SQD thresholds, surfaces redemption sweet spots. | `analyze_travel_profile`, `recommend_status_path`, `recommend_redemptions` |
| **Rebooking** | Proposes alternate routings (including Star Alliance interlines under §17(1)) and generates a calm phone-agent script. | `find_alternate_routings`, `generate_agent_script` |

Plus a cross-cutting `flag_for_human_handoff` tool that pushes high-severity conversations into the Ops queue.

## Why this is different from the 2024 chatbot

1. **Cite-or-refuse** — the system prompt requires every factual claim to name a specific clause from the loaded knowledge block. If it can't be cited, the assistant declines to answer and offers a human handoff. The frontend renders citations as styled chips so the user can see the provenance of every dollar amount.
2. **Deterministic tools for the dollar amounts** — compensation, baggage allowance, and status-path math run through typed tool calls with hand-written formulas. The model decides *when* to call a tool, not *what* the tool returns.
3. **Built-in escalation** — the model has a flag-for-handoff tool and is prompted to use it on rage, distress, or knowledge gaps. The Ops view picks it up within seconds.

## Architecture

- **Next.js 14** (App Router) + TypeScript + Tailwind. Single deployable, Vercel-ready.
- **Anthropic SDK** (`@anthropic-ai/sdk`) calling Claude Sonnet 4.6 by default. Override with `AC_COPILOT_MODEL` if you want to pitch on Opus 4.7.
- **Streaming** responses via Server-Sent Events.
- **Manual tool-use loop** in `app/api/chat/route.ts` so we can intercept every tool call, push a card to the UI, and update the Ops store.
- **Prompt caching** on the system rules + the four-module knowledge block (the bulk of every request) — surfaces `cache_read_input_tokens` in the chat footer to demonstrate the savings live.
- **In-memory store** (`lib/store.ts`) for the demo dashboard. Production replacement: Postgres + a real event bus.

## How to run

```bash
cp .env.example .env.local
# add ANTHROPIC_API_KEY from https://console.anthropic.com/
npm install
npm run dev
# open http://localhost:3000
```

Try these prompts on `/passenger`:

- *"AC456 from YYZ to LHR was cancelled 5 hours before departure due to crew scheduling. What am I owed?"* → calls `estimate_compensation`, returns CAD $700 with `[APPR §19(1)(a)(ii)]`.
- *"My bag (file YYZ12345) is 3 days late and I'm in Paris. What can I claim?"* → calls `lookup_baggage_status` then `estimate_baggage_allowance`, drafts a claim citing Montreal Convention Article 22.
- *"I'm Aeroplan member 9000001 and want to hit 50K this year. What's the cheapest path?"* → calls `analyze_travel_profile` then `recommend_status_path`.
- *"AC872 to FRA just cancelled and I have a meeting tomorrow at 2pm."* → calls `find_alternate_routings` with Star Alliance partner options.
- *"Can I get a refund because my dog was sad?"* → declines; offers human handoff (the cite-or-refuse contract working as designed).

Then open `/ops` to see the conversations roll in alongside seeded transcripts, with rage-flagged sessions surfaced at the top.

## File map

```
app/
  page.tsx                    # Landing / pitch page
  passenger/page.tsx          # Chat shell
  ops/page.tsx                # Ops dashboard shell
  api/chat/route.ts           # Streaming agent loop
  api/ops/route.ts            # Aggregated dashboard data
lib/
  anthropic.ts                # SDK client + model selection
  prompts.ts                  # System rules + serialized knowledge block
  tools.ts                    # 11 tool definitions + dispatch handlers
  store.ts                    # In-memory session store
  seed.ts                     # Realistic seeded transcripts for /ops
  knowledge/
    appr.ts                   # APPR §10–§29 + compensation tiers
    baggage.ts                # Montreal Convention + AC tariff Rule 55
    aeroplan.ts               # Status tiers + redemption sweet spots
    rebooking.ts              # §17/§18 + Star Alliance routing
components/
  Chat.tsx                    # Streaming chat with progressive card injection
  Cards.tsx                   # Per-module rendered cards
  Citation.tsx                # Inline clause-chip renderer
  ModuleBadge.tsx             # Disruption / Baggage / Aeroplan / Rebooking pill
  OpsDashboard.tsx            # CEO-facing dashboard with auto-refresh
```

## Rollout proposal

The pitch this demo supports:

1. **Weeks 0–2** — Shadow mode. The Care Copilot runs alongside human agents with no passenger-facing surface; agents see suggested replies, flag any hallucinations or miscites. Knowledge block is reviewed against AC's live tariff.
2. **Weeks 2–4** — Internal beta. AC employees can use the passenger chat for their own travel. Adversarial team red-teams the cite-or-refuse contract.
3. **Weeks 4–8** — Opt-in beta on aircanada.com behind a feature flag. Always-on human handoff. CTA-ready audit log of every cited clause and every dollar offered.
4. **Week 8+** — Full launch with ops-team monitoring of the rage queue, cited-clause coverage, and resolution-without-handoff metrics.

## Disclaimer

Concept demo. Knowledge content is sourced from public CTA, Montreal Convention, and Air Canada tariff materials and is intended for illustration. Production deployment must re-validate every clause against the current regulations and Air Canada's live tariff filings before any passenger-facing rollout.
