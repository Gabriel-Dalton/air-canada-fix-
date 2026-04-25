// Aeroplan status and redemption knowledge base. Numbers below are
// representative of the post-2020 Aeroplan program structure as published
// publicly by Air Canada. Demo content — verify against current program
// rules before production.

export const STATUS_TIERS = [
  {
    tier: "25K",
    sqm_required: 25_000,
    sqd_required_cad: 3_000,
    or_segments: 25,
    benefits: [
      "Priority check-in and boarding zone 2",
      "1 free checked bag (in addition to fare-class allowance)",
      "Star Alliance Silver",
      "eUpgrade credits at booking",
    ],
  },
  {
    tier: "35K",
    sqm_required: 35_000,
    sqd_required_cad: 4_000,
    or_segments: 35,
    benefits: [
      "Maple Leaf Lounge access on same-day Air Canada international flights",
      "2 free checked bags",
      "Better eUpgrade clearance window",
    ],
  },
  {
    tier: "50K",
    sqm_required: 50_000,
    sqd_required_cad: 6_000,
    or_segments: 50,
    benefits: [
      "Maple Leaf Lounge access including domestic + transborder",
      "Priority security at most Canadian airports",
      "Star Alliance Gold",
      "More eUpgrade credits",
    ],
  },
  {
    tier: "75K",
    sqm_required: 75_000,
    sqd_required_cad: 9_000,
    or_segments: 75,
    benefits: [
      "Concierge access on irregular operations",
      "More generous eUpgrade clearance",
      "Bonus base earn (1.5x)",
    ],
  },
  {
    tier: "Super Elite 100K",
    sqm_required: 100_000,
    sqd_required_cad: 20_000,
    or_segments: 95,
    benefits: [
      "Highest eUpgrade clearance priority",
      "Fixed Latitude reward upgrades available",
      "Companion lounge access",
    ],
  },
] as const;

export const STATUS_QUALIFICATION_RULES = {
  clause: "Aeroplan Elite Status Terms (2024)",
  text: "Status is earned by meeting BOTH a Status Qualifying Miles (SQM) or Segments (SQS) threshold AND a Status Qualifying Dollars (SQD) threshold within a calendar year. SQD requirement may be waived by holding an eligible Air Canada-branded credit card at the appropriate spend tier.",
};

export const REDEMPTION_SWEET_SPOTS = [
  {
    name: "Short-haul domestic Canada (under 1,500 mi)",
    points_one_way_economy_min: 6_000,
    points_one_way_economy_max: 13_500,
    cents_per_point_value: "1.5 - 2.5",
    note: "Best value when AC has flex/standard inventory at the lower end of the dynamic range. Compare against cash fare in CAD.",
  },
  {
    name: "Toronto/Montreal to London (one way, business class)",
    points_one_way_business_min: 60_000,
    points_one_way_business_max: 110_000,
    cents_per_point_value: "2.0 - 4.0",
    note: "Sweet spot when AC releases at-the-gate business saver awards. Watch for taxes/carrier surcharges; AC carrier surcharges are NOT charged on AC-operated awards (only on partner awards).",
  },
  {
    name: "Star Alliance partner short-haul intra-Asia (e.g., HND-ICN)",
    points_one_way_economy_min: 12_500,
    points_one_way_economy_max: 17_500,
    cents_per_point_value: "1.8 - 2.5",
    note: "ANA/Asiana award space; Aeroplan distance bands shine on partner short-haul.",
  },
  {
    name: "AC-operated business class to Australia/NZ via the Pacific",
    points_one_way_business_min: 110_000,
    points_one_way_business_max: 145_000,
    cents_per_point_value: "2.5 - 4.5",
    note: "AC-only journeys avoid partner surcharges; high cash equivalents make this a top redemption.",
  },
];

export const POINT_EARNING_RULES = [
  "Base earn on AC-operated flights: 2 points/$ for the lowest tier of Economy (Basic), up to 8 points/$ for Latitude/Premium Economy/Business.",
  "Status bonuses: 25K +25%, 35K +35%, 50K +50%, 75K +75%, Super Elite +100% on base earn.",
  "Co-branded credit cards (TD, CIBC, Amex Aeroplan): 1.0 - 3.0 points/$ on everyday spend with category multipliers; spend may also count toward SQD waivers.",
];

export const SAMPLE_MEMBERS = {
  "9000001": {
    member_id: "9000001",
    name: "A. Singh",
    home_airport: "YYZ",
    current_tier: "35K",
    ytd_sqm: 28_400,
    ytd_sqd_cad: 3_500,
    ytd_segments: 24,
    points_balance: 184_000,
    typical_routes: ["YYZ-LHR", "YYZ-JFK", "YYZ-YVR"],
    cards: ["TD Aeroplan Visa Infinite Privilege"],
  },
  "9000002": {
    member_id: "9000002",
    name: "M. Tremblay",
    home_airport: "YUL",
    current_tier: "25K",
    ytd_sqm: 18_900,
    ytd_sqd_cad: 2_400,
    ytd_segments: 16,
    points_balance: 67_500,
    typical_routes: ["YUL-CDG", "YUL-YYZ", "YUL-FLL"],
    cards: [],
  },
} as const;

export type AeroplanMemberId = keyof typeof SAMPLE_MEMBERS;
