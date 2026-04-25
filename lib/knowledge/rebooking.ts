// Rebooking obligations and Star Alliance interline routing patterns.

export const REBOOKING_OBLIGATIONS = {
  large_carrier_within_control: {
    clause: "APPR §17(1)",
    text: "Where a delay or cancellation is within carrier control, a large carrier must provide the passenger with confirmed reservation on the next available flight, operated by the carrier or a carrier with which it has a commercial agreement, leaving within nine hours of the original departure time.",
  },
  outside_control: {
    clause: "APPR §18(1)",
    text: "Where the disruption is outside carrier control, the carrier must rebook the passenger on the next available flight operated by it or a carrier with which it has a commercial agreement, departing within 48 hours of the end of the event causing the disruption.",
  },
  refund_alternative: {
    clause: "APPR §17(2) and §18(2)",
    text: "If the rebooked travel does not accommodate the passenger's travel needs, they are entitled to a refund of the unused portion of the ticket and, if no longer at their point of origin, return travel to that point at no additional cost.",
  },
};

export const STAR_ALLIANCE_PARTNERS_FOR_KEY_ROUTES = {
  "YYZ-LHR": [
    "Air Canada (AC) — direct, multiple daily",
    "United (UA) — connect via EWR/IAD",
    "Lufthansa (LH) — connect via FRA",
    "Austrian (OS) — connect via VIE",
  ],
  "YYZ-FRA": [
    "Air Canada (AC) — direct daily",
    "Lufthansa (LH) — direct daily",
    "United (UA) — connect via EWR",
  ],
  "YUL-CDG": [
    "Air Canada (AC) — direct, multiple daily",
    "Air France (AF) — codeshare, not Star Alliance",
    "Lufthansa (LH) — connect via FRA",
  ],
  "YVR-NRT": [
    "Air Canada (AC) — direct daily",
    "ANA (NH) — direct daily",
    "United (UA) — connect via SFO",
  ],
  "YYZ-JFK": [
    "Air Canada (AC) — direct, multiple daily",
    "United (UA) — connect via EWR/IAD",
  ],
};

export const SAMPLE_DISRUPTED_FLIGHTS = {
  AC872: {
    flight: "AC872",
    origin: "YYZ",
    destination: "FRA",
    scheduled_departure: "21:35 local",
    status: "cancelled",
    cause_category: "within_carrier_control" as const,
    cause_note: "Crew rest scheduling — re-rostered crew unavailable.",
  },
  AC848: {
    flight: "AC848",
    origin: "YYZ",
    destination: "LHR",
    scheduled_departure: "20:55 local",
    status: "cancelled",
    cause_category: "outside_carrier_control" as const,
    cause_note:
      "Severe weather closure at LHR; UK CAA-issued ground-stop affecting all carriers.",
  },
  AC456: {
    flight: "AC456",
    origin: "YYZ",
    destination: "LHR",
    scheduled_departure: "18:30 local",
    status: "delayed_5h",
    cause_category: "within_carrier_control_required_for_safety" as const,
    cause_note:
      "Engineering hold on a routine pre-flight engine inspection; aircraft swap completed.",
  },
} as const;

export type DisruptedFlightId = keyof typeof SAMPLE_DISRUPTED_FLIGHTS;

export const AGENT_SCRIPT_GUIDANCE = {
  clause: "APPR §17(1) + Air Canada Tariff Rule 80(C)(2)(c)",
  template: (opts: {
    flight: string;
    cause_category: "within_carrier_control" | "outside_carrier_control" | "within_carrier_control_required_for_safety";
    preferred_routing: string;
  }) =>
    [
      `Hi, my flight ${opts.flight} was disrupted.`,
      opts.cause_category === "within_carrier_control"
        ? `Per APPR §17(1), Air Canada's obligation as a large carrier is to rebook me on the next available flight operated by Air Canada or a commercial-agreement partner, departing within 9 hours of my original departure.`
        : opts.cause_category === "outside_carrier_control"
          ? `Per APPR §18(1), Air Canada is to rebook me on the next available flight by Air Canada or a commercial-agreement partner within 48 hours.`
          : `I understand this disruption is categorized as within-carrier-control but required for safety, so compensation under §19 doesn't apply, but rebooking under §17 still does.`,
      `My preferred routing is: ${opts.preferred_routing}.`,
      `If that's not feasible within the rebooking window, I'd like to discuss the §17(2) refund-and-return-to-origin option.`,
      `Could you please confirm whether you can issue this rebooking now?`,
    ].join(" "),
};
