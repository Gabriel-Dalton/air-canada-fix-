// Delayed and damaged baggage rules. Cites the Montreal Convention (incorporated
// into Canadian law via the Carriage by Air Act) and Air Canada's published
// general conditions of carriage / international tariff.
// Demo content — production must validate against the current Air Canada
// tariff filings.

export const MONTREAL_CONVENTION_LIMIT = {
  clause: "Montreal Convention 1999, Article 22(2)",
  // Liability cap is denominated in Special Drawing Rights. Limit was raised
  // to 1,288 SDR per passenger effective 28 December 2019.
  limit_sdr: 1288,
  approx_cad: 2300,
  text: "In the carriage of baggage, the liability of the carrier in the case of destruction, loss, damage or delay is limited to 1,288 SDR per passenger (approximately CAD $2,300) unless a special declaration of higher value was made at check-in and a supplementary sum paid.",
};

export const NOTICE_DEADLINES = {
  damaged_baggage: {
    clause: "Montreal Convention Article 31(2)",
    days: 7,
    text: "Written complaint of damage must be made within 7 days from the date of receipt of the baggage.",
  },
  delayed_baggage: {
    clause: "Montreal Convention Article 31(2)",
    days: 21,
    text: "In the case of delay, written complaint must be made within 21 days from the date the baggage was placed at the passenger's disposal.",
  },
};

// Air Canada's published interim-expense allowance for delayed bags on
// international itineraries. Demo placeholder — verify against the live
// tariff before production.
export const INTERIM_EXPENSE_ALLOWANCE = {
  clause: "Air Canada International Tariff, Rule 55(C)(3) — interim expenses",
  daily_cap_cad: 100,
  total_cap_days: 5,
  text: "Reasonable interim expenses for essential items (toiletries, basic clothing) incurred while baggage is delayed away from a passenger's place of permanent residence are reimbursable up to CAD $100/day for up to 5 days, on submission of receipts. The bag must remain delayed at the time of expense.",
};

export const FILE_REFERENCE_PATTERNS = [
  "Air Canada baggage file references follow the format ABCXYZ12345 (3 letters of the airport code + 5 digits) and are issued at the baggage service desk.",
  "World Tracer is the back-end tracing system used by Air Canada and ~500 partner airlines; status updates flow through World Tracer regardless of which airline mishandled the bag.",
];

export const COMMON_OUTCOMES = [
  {
    status: "delayed_in_transit",
    typical_resolution_hours: 24,
    note: "Bag identified at a connecting hub and routed on the next flight with available cargo space.",
  },
  {
    status: "delayed_misrouted",
    typical_resolution_hours: 48,
    note: "Bag tagged to wrong destination; resolution depends on next available flight from the misrouted airport.",
  },
  {
    status: "delayed_offload",
    typical_resolution_hours: 36,
    note: "Bag offloaded from original flight for weight/space reasons; usually arrives on a follow-up flight same or next day.",
  },
  {
    status: "lost",
    typical_resolution_hours: 21 * 24,
    note: "After 21 days with no World Tracer match, bag is officially declared lost and the claim shifts to liability under Article 22.",
  },
];

export function estimateInterimAllowance(opts: {
  daysDelayed: number;
}): { amount_cad: number; clause: string; rationale: string } {
  const days = Math.min(
    Math.max(0, Math.floor(opts.daysDelayed)),
    INTERIM_EXPENSE_ALLOWANCE.total_cap_days,
  );
  const amount = days * INTERIM_EXPENSE_ALLOWANCE.daily_cap_cad;
  return {
    amount_cad: amount,
    clause: INTERIM_EXPENSE_ALLOWANCE.clause,
    rationale: `Interim expenses for ${days} day(s) of delay at CAD $${INTERIM_EXPENSE_ALLOWANCE.daily_cap_cad}/day, capped at ${INTERIM_EXPENSE_ALLOWANCE.total_cap_days} days. Reimbursable on submission of receipts; the cap is on Air Canada's allowance, not on a passenger's actual recoverable damages, which can extend up to the Montreal Convention limit.`,
  };
}

// Mock baggage cases for the demo. Real implementation would call into the
// World Tracer / Air Canada baggage services API.
export const SAMPLE_BAGGAGE_CASES = {
  YYZ12345: {
    file_ref: "YYZ12345",
    passenger_name: "Sample Passenger",
    origin: "FRA",
    destination: "YYZ",
    last_known_location: "FRA",
    status: "delayed_in_transit" as const,
    bag_descriptor: "Black hardshell, 26 inch, blue ribbon on handle",
    days_delayed: 3,
    expected_delivery_window: "next 24-48 hours",
  },
  CDG78901: {
    file_ref: "CDG78901",
    passenger_name: "Sample Passenger",
    origin: "YUL",
    destination: "CDG",
    last_known_location: "unknown",
    status: "delayed_misrouted" as const,
    bag_descriptor: "Grey soft-side, 24 inch",
    days_delayed: 5,
    expected_delivery_window: "World Tracer match pending; up to 7 days",
  },
} as const;

export type BaggageStatus = keyof typeof SAMPLE_BAGGAGE_CASES;
