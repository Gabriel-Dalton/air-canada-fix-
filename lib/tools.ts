import type Anthropic from "@anthropic-ai/sdk";
import {
  CAUSE_CATEGORIES,
  COMPENSATION_SCHEDULE_LARGE,
  CLAIM_DEADLINES,
  estimateCompensationAmount,
  type CauseCategory,
} from "./knowledge/appr";
import {
  estimateInterimAllowance,
  MONTREAL_CONVENTION_LIMIT,
  NOTICE_DEADLINES,
  SAMPLE_BAGGAGE_CASES,
  type BaggageStatus,
} from "./knowledge/baggage";
import {
  REDEMPTION_SWEET_SPOTS,
  SAMPLE_MEMBERS,
  STATUS_TIERS,
  type AeroplanMemberId,
} from "./knowledge/aeroplan";
import {
  AGENT_SCRIPT_GUIDANCE,
  REBOOKING_OBLIGATIONS,
  SAMPLE_DISRUPTED_FLIGHTS,
  STAR_ALLIANCE_PARTNERS_FOR_KEY_ROUTES,
  type DisruptedFlightId,
} from "./knowledge/rebooking";
import { store, type SkillModule } from "./store";

export const TOOLS: Anthropic.Tool[] = [
  // ── Disruption module ────────────────────────────────────────────────
  {
    name: "estimate_compensation",
    description:
      "Computes APPR §19 compensation owed to a passenger of a large carrier (Air Canada) for a delay or cancellation. Returns a CAD amount and the controlling clause. Use when the user has shared (or implied) a delay duration in hours AND a cause category.",
    input_schema: {
      type: "object",
      properties: {
        delay_hours_at_destination: {
          type: "number",
          description:
            "How many hours late the passenger arrived (or will arrive) at their final destination relative to the original schedule.",
        },
        cause_category: {
          type: "string",
          enum: [
            "within_carrier_control",
            "within_carrier_control_required_for_safety",
            "outside_carrier_control",
          ],
          description:
            "Why the disruption happened. 'within_carrier_control' covers crew scheduling, overbooking, scheduled maintenance, IT outages owned by AC. 'within_carrier_control_required_for_safety' covers unscheduled mechanical issues found in safety checks. 'outside_carrier_control' covers weather, ATC, security, third-party labour actions.",
        },
      },
      required: ["delay_hours_at_destination", "cause_category"],
    },
  },
  {
    name: "draft_appr_claim_letter",
    description:
      "Generates a formatted written compensation claim under APPR §19 that the passenger can submit through Air Canada's claim form. Includes statutory references and the 30-day response window.",
    input_schema: {
      type: "object",
      properties: {
        passenger_name: { type: "string" },
        flight_number: { type: "string", description: "e.g. AC456" },
        flight_date: { type: "string", description: "ISO date" },
        origin: { type: "string", description: "Airport IATA code" },
        destination: { type: "string", description: "Airport IATA code" },
        delay_hours_at_destination: { type: "number" },
        cause_category: {
          type: "string",
          enum: [
            "within_carrier_control",
            "within_carrier_control_required_for_safety",
            "outside_carrier_control",
          ],
        },
        amount_claimed_cad: { type: "number" },
      },
      required: [
        "passenger_name",
        "flight_number",
        "flight_date",
        "origin",
        "destination",
        "delay_hours_at_destination",
        "cause_category",
        "amount_claimed_cad",
      ],
    },
  },

  // ── Baggage module ───────────────────────────────────────────────────
  {
    name: "lookup_baggage_status",
    description:
      "Look up a baggage delay file by reference (format: 3-letter airport code + 5 digits, e.g. YYZ12345). Returns last-known status from World Tracer. Demo-mode: only seeded references will resolve.",
    input_schema: {
      type: "object",
      properties: {
        file_reference: { type: "string" },
      },
      required: ["file_reference"],
    },
  },
  {
    name: "estimate_baggage_allowance",
    description:
      "Computes the interim-expense allowance owed under Air Canada's tariff Rule 55(C)(3) when a bag is delayed. Returns CAD amount and the controlling clause.",
    input_schema: {
      type: "object",
      properties: {
        days_delayed: { type: "number" },
      },
      required: ["days_delayed"],
    },
  },
  {
    name: "draft_baggage_claim",
    description:
      "Generates a formatted delayed-baggage claim citing Montreal Convention Article 22 and the AC tariff interim-expense rule.",
    input_schema: {
      type: "object",
      properties: {
        passenger_name: { type: "string" },
        file_reference: { type: "string" },
        days_delayed: { type: "number" },
        receipts_total_cad: { type: "number" },
      },
      required: [
        "passenger_name",
        "file_reference",
        "days_delayed",
        "receipts_total_cad",
      ],
    },
  },

  // ── Aeroplan module ──────────────────────────────────────────────────
  {
    name: "analyze_travel_profile",
    description:
      "Looks up a (mocked) Aeroplan member's profile, including current tier, YTD SQM/SQD/segments, points balance, and typical routes. Demo-mode: only seeded members will resolve.",
    input_schema: {
      type: "object",
      properties: {
        member_id: {
          type: "string",
          description: "7-digit Aeroplan member number.",
        },
      },
      required: ["member_id"],
    },
  },
  {
    name: "recommend_status_path",
    description:
      "Given a member profile and a target tier, returns the cheapest combination of additional flying or credit-card spend to reach the tier this calendar year.",
    input_schema: {
      type: "object",
      properties: {
        member_id: { type: "string" },
        target_tier: {
          type: "string",
          enum: ["25K", "35K", "50K", "75K", "Super Elite 100K"],
        },
      },
      required: ["member_id", "target_tier"],
    },
  },
  {
    name: "recommend_redemptions",
    description:
      "Suggests sweet-spot Aeroplan redemptions for a goal (e.g. 'Asia business', 'short-haul Canada', 'transatlantic business'). Returns ranked options with point cost and estimated CAD value.",
    input_schema: {
      type: "object",
      properties: {
        goal: { type: "string" },
      },
      required: ["goal"],
    },
  },

  // ── Rebooking module ─────────────────────────────────────────────────
  {
    name: "find_alternate_routings",
    description:
      "Given a disrupted flight, returns alternate routings. Includes Star Alliance commercial-agreement partners when AC's own next flight is outside the §17(1) 9-hour entitlement window. Demo-mode: only seeded flights will resolve.",
    input_schema: {
      type: "object",
      properties: {
        flight_number: {
          type: "string",
          description: "e.g. AC872",
        },
      },
      required: ["flight_number"],
    },
  },
  {
    name: "generate_agent_script",
    description:
      "Generates a polite, policy-anchored script the passenger can read to a phone agent or use in chat to assert their rebooking rights. Include the relevant cause category and preferred routing.",
    input_schema: {
      type: "object",
      properties: {
        flight_number: { type: "string" },
        cause_category: {
          type: "string",
          enum: [
            "within_carrier_control",
            "within_carrier_control_required_for_safety",
            "outside_carrier_control",
          ],
        },
        preferred_routing: {
          type: "string",
          description:
            "What the passenger wants — e.g. 'next AC direct flight', 'route via FRA on Lufthansa', 'refund and return to YYZ'.",
        },
      },
      required: ["flight_number", "cause_category", "preferred_routing"],
    },
  },

  // ── Cross-cutting ─────────────────────────────────────────────────────
  {
    name: "flag_for_human_handoff",
    description:
      "Push the conversation into the Ops urgency queue. Use when the user expresses sustained anger, distress, a safety concern, or asks something the knowledge base cannot answer. Do NOT use for ordinary frustration.",
    input_schema: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description:
            "One short sentence explaining why this conversation needs a human. Will be visible to the live agent.",
        },
        severity: {
          type: "string",
          enum: ["low", "medium", "high"],
        },
      },
      required: ["reason", "severity"],
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Tool dispatcher. Returns a structured payload that the chat route renders
// into a card AND feeds back to the model as the tool_result.
// ─────────────────────────────────────────────────────────────────────────

export type ToolModule = SkillModule;

export interface ToolOutcome {
  module: ToolModule;
  card: { kind: string; data: Record<string, unknown> } | null;
  result: string; // text fed back to the model
  topic_tag?: string;
  flag?: { reason: string; severity: "low" | "medium" | "high" };
}

export function runTool(
  name: string,
  input: Record<string, unknown>,
  ctx: { sessionId: string },
): ToolOutcome {
  switch (name) {
    case "estimate_compensation":
      return runEstimateCompensation(input);
    case "draft_appr_claim_letter":
      return runDraftClaimLetter(input);
    case "lookup_baggage_status":
      return runLookupBaggage(input);
    case "estimate_baggage_allowance":
      return runEstimateBaggageAllowance(input);
    case "draft_baggage_claim":
      return runDraftBaggageClaim(input);
    case "analyze_travel_profile":
      return runAnalyzeTravelProfile(input);
    case "recommend_status_path":
      return runRecommendStatusPath(input);
    case "recommend_redemptions":
      return runRecommendRedemptions(input);
    case "find_alternate_routings":
      return runFindAlternateRoutings(input);
    case "generate_agent_script":
      return runGenerateAgentScript(input);
    case "flag_for_human_handoff":
      return runFlagHandoff(input, ctx);
    default:
      return {
        module: "general",
        card: null,
        result: `Unknown tool: ${name}`,
      };
  }
}

// ── Disruption ─────────────────────────────────────────────────────────

function runEstimateCompensation(input: Record<string, unknown>): ToolOutcome {
  const delay = Number(input.delay_hours_at_destination);
  const cause = String(input.cause_category) as CauseCategory;
  const out = estimateCompensationAmount({
    delayHours: delay,
    causeCategory: cause,
  });
  return {
    module: "disruption",
    topic_tag: "delay-compensation",
    card: {
      kind: "compensation",
      data: {
        amount_cad: out.amount_cad,
        clause: out.clause,
        rationale: out.rationale,
        delay_hours: delay,
        cause_category: cause,
        cause_label: CAUSE_CATEGORIES[cause].label,
        schedule: COMPENSATION_SCHEDULE_LARGE.map((t) => ({
          range:
            t.delay_hours_max === Infinity
              ? `${t.delay_hours_min}+ h`
              : `${t.delay_hours_min}–${t.delay_hours_max} h`,
          amount_cad: t.amount_cad,
          clause: t.clause,
        })),
      },
    },
    result: JSON.stringify(out),
  };
}

function runDraftClaimLetter(input: Record<string, unknown>): ToolOutcome {
  const cause = String(input.cause_category) as CauseCategory;
  const causeLabel = CAUSE_CATEGORIES[cause].label;
  const causeClause = CAUSE_CATEGORIES[cause].clause;
  const letter = `Subject: APPR §19 compensation claim — ${input.flight_number} on ${input.flight_date}

To: Air Canada Customer Relations
From: ${input.passenger_name}

I am writing to formally claim minimum compensation for inconvenience under the Air Passenger Protection Regulations (SOR/2019-150).

Flight: ${input.flight_number}
Route: ${input.origin} → ${input.destination}
Date: ${input.flight_date}
Delay at final destination: ${input.delay_hours_at_destination} hours

Air Canada is a large carrier under SOR/2019-150 §1. My understanding is that this disruption falls within the category "${causeLabel}" (${causeClause}). On that basis, the minimum compensation due under APPR §19(1) for a delay of ${input.delay_hours_at_destination} hours at the final destination is CAD $${Number(input.amount_claimed_cad).toLocaleString()}.

I respectfully request payment in this amount. ${CLAIM_DEADLINES.carrier_response_text} (${CLAIM_DEADLINES.carrier_response_clause}).

If you intend to dispute the cause categorization, please cite the specific operational record relied upon, as is required for the regulator's review under §31 of the Canada Transportation Act.

Sincerely,
${input.passenger_name}`;
  return {
    module: "disruption",
    topic_tag: "claim-letter",
    card: {
      kind: "claim_letter",
      data: { letter, amount_claimed_cad: Number(input.amount_claimed_cad) },
    },
    result: letter,
  };
}

// ── Baggage ────────────────────────────────────────────────────────────

function runLookupBaggage(input: Record<string, unknown>): ToolOutcome {
  const ref = String(input.file_reference).toUpperCase() as BaggageStatus;
  const c = SAMPLE_BAGGAGE_CASES[ref];
  if (!c) {
    return {
      module: "baggage",
      card: null,
      result: `No World Tracer record found for "${input.file_reference}". In demo mode, only YYZ12345 and CDG78901 will resolve.`,
    };
  }
  return {
    module: "baggage",
    topic_tag: "lost-bag",
    card: { kind: "baggage_status", data: { ...c } },
    result: JSON.stringify(c),
  };
}

function runEstimateBaggageAllowance(input: Record<string, unknown>): ToolOutcome {
  const days = Number(input.days_delayed);
  const out = estimateInterimAllowance({ daysDelayed: days });
  return {
    module: "baggage",
    topic_tag: "delayed-bag-interim-allowance",
    card: {
      kind: "baggage_allowance",
      data: {
        amount_cad: out.amount_cad,
        days,
        clause: out.clause,
        rationale: out.rationale,
        notice_deadline_days: NOTICE_DEADLINES.delayed_baggage.days,
        notice_clause: NOTICE_DEADLINES.delayed_baggage.clause,
      },
    },
    result: JSON.stringify(out),
  };
}

function runDraftBaggageClaim(input: Record<string, unknown>): ToolOutcome {
  const letter = `Subject: Delayed baggage claim — file ${input.file_reference}

To: Air Canada Baggage Services
From: ${input.passenger_name}

Bag file reference: ${input.file_reference}
Days delayed at the time of writing: ${input.days_delayed}

I am submitting this written notice within ${NOTICE_DEADLINES.delayed_baggage.days} days of my baggage being placed at my disposal, as required by ${NOTICE_DEADLINES.delayed_baggage.clause}.

I am claiming reimbursement for reasonable interim expenses incurred while my baggage was delayed, totalling CAD $${Number(input.receipts_total_cad).toLocaleString()}. Receipts are attached. This claim is consistent with ${MONTREAL_CONVENTION_LIMIT.clause} (Air Canada's liability is capped at ${MONTREAL_CONVENTION_LIMIT.limit_sdr} SDR per passenger, approximately CAD $${MONTREAL_CONVENTION_LIMIT.approx_cad.toLocaleString()}, unless a special declaration of value was made at check-in) and with Air Canada's published interim-expense allowance under International Tariff Rule 55(C)(3).

Please confirm receipt and process payment in the ordinary course.

Sincerely,
${input.passenger_name}`;
  return {
    module: "baggage",
    topic_tag: "lost-bag-claim",
    card: { kind: "claim_letter", data: { letter, amount_claimed_cad: Number(input.receipts_total_cad) } },
    result: letter,
  };
}

// ── Aeroplan ───────────────────────────────────────────────────────────

function runAnalyzeTravelProfile(input: Record<string, unknown>): ToolOutcome {
  const id = String(input.member_id) as AeroplanMemberId;
  const member = SAMPLE_MEMBERS[id];
  if (!member) {
    return {
      module: "aeroplan",
      card: null,
      result: `No Aeroplan profile found for member "${input.member_id}". In demo mode, only 9000001 and 9000002 will resolve.`,
    };
  }
  return {
    module: "aeroplan",
    topic_tag: "profile-lookup",
    card: { kind: "aeroplan_profile", data: { ...member } },
    result: JSON.stringify(member),
  };
}

function runRecommendStatusPath(input: Record<string, unknown>): ToolOutcome {
  const id = String(input.member_id) as AeroplanMemberId;
  const target = String(input.target_tier);
  const member = SAMPLE_MEMBERS[id];
  const tier = STATUS_TIERS.find((t) => t.tier === target);
  if (!member || !tier) {
    return {
      module: "aeroplan",
      card: null,
      result: `Cannot compute path: ${!member ? `member ${id} not in demo data` : ""}${!tier ? ` target tier ${target} unknown` : ""}.`.trim(),
    };
  }
  const sqmGap = Math.max(0, tier.sqm_required - member.ytd_sqm);
  const sqdGap = Math.max(0, tier.sqd_required_cad - member.ytd_sqd_cad);
  const segGap = Math.max(0, tier.or_segments - member.ytd_segments);

  const cardSpend = Math.ceil(sqdGap / 0.25); // simplified: assume Aeroplan-card SQD waiver at $25K spend earning
  const recommendation =
    sqmGap === 0 && sqdGap === 0
      ? `Already qualified for ${target}.`
      : `To reach ${target} this calendar year:\n` +
        `- Earn ${sqmGap.toLocaleString()} more Status Qualifying Miles (SQM) — roughly ${Math.ceil(sqmGap / 4000)} more YYZ-LHR round-trips in Latitude or Premium Economy.\n` +
        `- Or alternatively, ${segGap} more eligible segments.\n` +
        `- AND CAD $${sqdGap.toLocaleString()} more in Status Qualifying Dollars (SQD), or qualifying Air Canada-branded credit-card spend (~$${cardSpend.toLocaleString()} on a TD Aeroplan Visa Infinite Privilege at the SQD-waiver tier) per the Aeroplan Elite Status Terms.`;

  return {
    module: "aeroplan",
    topic_tag: "status-fast-track",
    card: {
      kind: "aeroplan_status_path",
      data: {
        member_id: member.member_id,
        current_tier: member.current_tier,
        target_tier: target,
        sqm_gap: sqmGap,
        sqd_gap_cad: sqdGap,
        segment_gap: segGap,
        recommendation,
      },
    },
    result: recommendation,
  };
}

function runRecommendRedemptions(input: Record<string, unknown>): ToolOutcome {
  const goal = String(input.goal).toLowerCase();
  // Naive scoring by keyword match against the sweet-spot list.
  const scored = REDEMPTION_SWEET_SPOTS.map((r) => {
    const hay = `${r.name} ${r.note}`.toLowerCase();
    const score = goal
      .split(/\s+/)
      .filter(Boolean)
      .reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
    return { ...r, score };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  return {
    module: "aeroplan",
    topic_tag: "redemption-sweet-spot",
    card: {
      kind: "aeroplan_redemptions",
      data: { goal, options: scored },
    },
    result: JSON.stringify(scored),
  };
}

// ── Rebooking ──────────────────────────────────────────────────────────

function runFindAlternateRoutings(input: Record<string, unknown>): ToolOutcome {
  const id = String(input.flight_number).toUpperCase() as DisruptedFlightId;
  const flight = SAMPLE_DISRUPTED_FLIGHTS[id];
  if (!flight) {
    return {
      module: "rebooking",
      card: null,
      result: `Flight ${input.flight_number} is not in the demo dataset. Seeded flights: AC872, AC848, AC456.`,
    };
  }
  const routeKey = `${flight.origin}-${flight.destination}` as keyof typeof STAR_ALLIANCE_PARTNERS_FOR_KEY_ROUTES;
  const partners = STAR_ALLIANCE_PARTNERS_FOR_KEY_ROUTES[routeKey] ?? [
    "Air Canada (AC) — check next available frequency",
    "Star Alliance commercial-agreement partner — request explicitly under APPR §17(1)",
  ];
  const obligation =
    flight.cause_category === "outside_carrier_control"
      ? REBOOKING_OBLIGATIONS.outside_control
      : REBOOKING_OBLIGATIONS.large_carrier_within_control;
  return {
    module: "rebooking",
    topic_tag:
      flight.cause_category === "outside_carrier_control"
        ? "outside-control-rebooking"
        : "rebooking-9hr-window",
    card: {
      kind: "rebooking_options",
      data: {
        flight: { ...flight },
        partners,
        obligation_text: obligation.text,
        obligation_clause: obligation.clause,
        cause_label: CAUSE_CATEGORIES[flight.cause_category].label,
      },
    },
    result: JSON.stringify({ flight, partners, obligation }),
  };
}

function runGenerateAgentScript(input: Record<string, unknown>): ToolOutcome {
  const cause = String(input.cause_category) as CauseCategory;
  const script = AGENT_SCRIPT_GUIDANCE.template({
    flight: String(input.flight_number),
    cause_category: cause,
    preferred_routing: String(input.preferred_routing),
  });
  return {
    module: "rebooking",
    topic_tag: "agent-script",
    card: {
      kind: "agent_script",
      data: {
        script,
        clause: AGENT_SCRIPT_GUIDANCE.clause,
      },
    },
    result: script,
  };
}

// ── Cross-cutting ──────────────────────────────────────────────────────

function runFlagHandoff(
  input: Record<string, unknown>,
  ctx: { sessionId: string },
): ToolOutcome {
  const reason = String(input.reason);
  const severity = String(input.severity) as "low" | "medium" | "high";
  store.patch(ctx.sessionId, {
    flag: { reason, severity, flagged_at: Date.now() },
    sentiment: severity === "high" ? "rage" : "frustrated",
  });
  return {
    module: "general",
    topic_tag: "human-handoff",
    flag: { reason, severity },
    card: {
      kind: "handoff",
      data: { reason, severity },
    },
    result: `Conversation flagged for human handoff at severity "${severity}". A live agent will see this in the Ops queue.`,
  };
}
