// Air Passenger Protection Regulations (APPR) — knowledge base.
// Sourced from public Canadian Transportation Agency materials. Numbers and
// causal categories are accurate as of the regulation's most recent published
// amendments; demo data only — production deployment must re-validate against
// current CTA guidance and Air Canada's tariff before going live.

export const APPR_CARRIER_SIZE = {
  large: {
    label: "Large carrier (Air Canada)",
    note: "Air Canada is a large carrier under SOR/2019-150 §1.",
  },
} as const;

export type CauseCategory =
  | "within_carrier_control"
  | "within_carrier_control_required_for_safety"
  | "outside_carrier_control";

export const CAUSE_CATEGORIES: Record<
  CauseCategory,
  { label: string; examples: string[]; clause: string; entitlements: string[] }
> = {
  within_carrier_control: {
    label: "Within carrier control",
    examples: [
      "crew scheduling errors",
      "commercial overbooking",
      "scheduled maintenance",
      "IT outages owned by the airline",
    ],
    clause: "APPR §12(2) and §19(1) — large carrier obligations",
    entitlements: [
      "Standard of treatment (food, drink, communication) per APPR §14",
      "Rebooking on next available flight per APPR §17",
      "Compensation for inconvenience per APPR §19 (see schedule below)",
      "Refund if rebooking does not meet passenger's travel needs (§17(2))",
    ],
  },
  within_carrier_control_required_for_safety: {
    label: "Within carrier control but required for safety",
    examples: [
      "unscheduled maintenance arising from a safety check",
      "mechanical malfunction discovered pre-flight",
    ],
    clause: "APPR §11(3)(b)",
    entitlements: [
      "Standard of treatment per §14",
      "Rebooking per §17",
      "NO compensation for inconvenience under §19",
    ],
  },
  outside_carrier_control: {
    label: "Outside carrier control",
    examples: [
      "weather",
      "ATC instructions",
      "security alerts",
      "labour disruptions outside the airline",
      "medical diversions",
    ],
    clause: "APPR §10",
    entitlements: [
      "Rebooking per §18 (alternate flight)",
      "NO compensation for inconvenience",
      "NO obligation for standard of treatment beyond information",
    ],
  },
};

// APPR §19(1) compensation schedule for large carriers — payable when the
// disruption is within carrier control and not required for safety, measured
// at arrival at the final destination.
export const COMPENSATION_SCHEDULE_LARGE = [
  {
    delay_hours_min: 3,
    delay_hours_max: 6,
    amount_cad: 400,
    clause: "APPR §19(1)(a)(i)",
  },
  {
    delay_hours_min: 6,
    delay_hours_max: 9,
    amount_cad: 700,
    clause: "APPR §19(1)(a)(ii)",
  },
  {
    delay_hours_min: 9,
    delay_hours_max: Infinity,
    amount_cad: 1000,
    clause: "APPR §19(1)(a)(iii)",
  },
] as const;

export const DENIED_BOARDING_LARGE = [
  {
    delay_hours_min: 0,
    delay_hours_max: 6,
    amount_cad: 900,
    clause: "APPR §20(1)(a)",
  },
  {
    delay_hours_min: 6,
    delay_hours_max: 9,
    amount_cad: 1800,
    clause: "APPR §20(1)(b)",
  },
  {
    delay_hours_min: 9,
    delay_hours_max: Infinity,
    amount_cad: 2400,
    clause: "APPR §20(1)(c)",
  },
] as const;

export const STANDARD_OF_TREATMENT = {
  clause: "APPR §14",
  text: "Where a delay attributable to the carrier exceeds two hours, the carrier must provide food and drink in reasonable quantities, taking into account the length of the wait, the time of day and the location of the passenger; and a means of communication free of charge.",
};

export const REBOOKING_OBLIGATION = {
  clause: "APPR §17",
  text: "Large carriers must rebook a passenger on their next available flight operated by the carrier or a carrier with which it has a commercial agreement, departing within 9 hours of the original departure. If unable, the carrier must offer a refund and travel from the place where the passenger is currently located back to the point of origin.",
};

export const CLAIM_DEADLINES = {
  passenger_to_carrier_clause: "APPR §19(3) and §29",
  passenger_to_carrier_text:
    "Passengers have one year from the day of the disruption to file a written claim with the carrier.",
  carrier_response_clause: "APPR §19(4)",
  carrier_response_text:
    "The carrier must respond within 30 days of receiving the claim, either with payment or with a written reason for refusing.",
  cta_escalation_text:
    "If unsatisfied with the carrier's response, the passenger may file a complaint with the Canadian Transportation Agency (CTA) under §31 of the Canada Transportation Act.",
};

export const APPR_CITATIONS_INDEX = [
  "APPR §10 — disruptions outside carrier control",
  "APPR §11 — disruptions within carrier control required for safety",
  "APPR §12 — disruptions within carrier control",
  "APPR §14 — standard of treatment",
  "APPR §17 — rebooking when within carrier control",
  "APPR §18 — rebooking when outside carrier control",
  "APPR §19 — minimum compensation for inconvenience (large carrier)",
  "APPR §20 — denied boarding compensation (large carrier)",
  "APPR §29 — written claim window (one year)",
];

export function estimateCompensationAmount(opts: {
  delayHours: number;
  causeCategory: CauseCategory;
}): { amount_cad: number; clause: string; rationale: string } {
  if (opts.causeCategory !== "within_carrier_control") {
    return {
      amount_cad: 0,
      clause: CAUSE_CATEGORIES[opts.causeCategory].clause,
      rationale: `Compensation under APPR §19 is not payable when the disruption is categorized as "${CAUSE_CATEGORIES[opts.causeCategory].label}". Rebooking and (where applicable) standard of treatment may still apply.`,
    };
  }
  if (opts.delayHours < 3) {
    return {
      amount_cad: 0,
      clause: "APPR §19(1)",
      rationale:
        "Compensation under APPR §19 is only payable when the passenger arrives at their final destination at least three hours later than originally scheduled.",
    };
  }
  for (const tier of COMPENSATION_SCHEDULE_LARGE) {
    if (
      opts.delayHours >= tier.delay_hours_min &&
      opts.delayHours < tier.delay_hours_max
    ) {
      return {
        amount_cad: tier.amount_cad,
        clause: tier.clause,
        rationale: `For a large carrier, a delay of ${opts.delayHours} hour(s) at the final destination caused by a disruption within carrier control entitles the passenger to CAD $${tier.amount_cad.toLocaleString()}.`,
      };
    }
  }
  return {
    amount_cad: 1000,
    clause: "APPR §19(1)(a)(iii)",
    rationale: "Delay of 9+ hours; maximum tier applies.",
  };
}
