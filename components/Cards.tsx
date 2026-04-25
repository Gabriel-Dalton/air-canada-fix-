import { CitedText } from "./Citation";

// One renderer per tool card kind. The chat route emits {kind, data} on the
// `card` SSE event; the Chat component dispatches to these.

export function CardWrapper({
  title,
  accent,
  children,
}: {
  title: string;
  accent: "red" | "amber" | "mint" | "ink" | "muted";
  children: React.ReactNode;
}) {
  const ring = {
    red: "border-ac-red/30 bg-ac-red/5",
    amber: "border-ac-amber/30 bg-ac-amber/5",
    mint: "border-ac-mint/30 bg-ac-mint/5",
    ink: "border-ac-ink/20 bg-ac-ink/5",
    muted: "border-ac-line bg-white",
  }[accent];
  return (
    <div className={`mt-3 rounded-xl border p-4 ${ring}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-ac-muted">
          {title}
        </div>
      </div>
      {children}
    </div>
  );
}

export function CompensationCard({
  data,
}: {
  data: {
    amount_cad: number;
    clause: string;
    rationale: string;
    cause_label: string;
    delay_hours: number;
    schedule: { range: string; amount_cad: number; clause: string }[];
  };
}) {
  return (
    <CardWrapper title="APPR §19 compensation estimate" accent="red">
      <div className="flex items-baseline gap-3">
        <div className="font-serif text-4xl font-bold text-ac-ink">
          {data.amount_cad === 0
            ? "Not owed"
            : `CAD $${data.amount_cad.toLocaleString()}`}
        </div>
        <div className="text-xs text-ac-muted">{data.clause}</div>
      </div>
      <div className="mt-2 text-sm leading-relaxed text-ac-ink/80">
        <CitedText text={data.rationale} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        {data.schedule.map((row) => (
          <div
            key={row.clause}
            className={`rounded-lg border px-2 py-1.5 ${
              row.amount_cad === data.amount_cad
                ? "border-ac-red bg-white font-semibold text-ac-ink"
                : "border-ac-line bg-white/60 text-ac-muted"
            }`}
          >
            <div>{row.range}</div>
            <div>CAD ${row.amount_cad.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </CardWrapper>
  );
}

export function ClaimLetterCard({
  data,
}: {
  data: { letter: string; amount_claimed_cad: number };
}) {
  return (
    <CardWrapper title="Draft claim letter" accent="ink">
      <pre className="whitespace-pre-wrap rounded-md bg-white p-3 font-mono text-xs leading-relaxed text-ac-ink">
        {data.letter}
      </pre>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-ac-muted">
          Amount claimed: CAD ${data.amount_claimed_cad.toLocaleString()}
        </span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(data.letter);
          }}
          className="rounded-md border border-ac-line bg-white px-2.5 py-1 font-medium text-ac-ink hover:bg-ac-paper"
        >
          Copy to clipboard
        </button>
      </div>
    </CardWrapper>
  );
}

export function BaggageStatusCard({
  data,
}: {
  data: {
    file_ref: string;
    status: string;
    last_known_location: string;
    bag_descriptor: string;
    days_delayed: number;
    expected_delivery_window: string;
    origin: string;
    destination: string;
  };
}) {
  return (
    <CardWrapper title={`World Tracer file ${data.file_ref}`} accent="amber">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-ac-muted">Status</div>
          <div className="font-medium">{data.status.replace(/_/g, " ")}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-ac-muted">Days delayed</div>
          <div className="font-medium">{data.days_delayed}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-ac-muted">Last seen</div>
          <div className="font-medium">{data.last_known_location}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-ac-muted">Routing</div>
          <div className="font-medium">{data.origin} → {data.destination}</div>
        </div>
        <div className="col-span-2">
          <div className="text-[11px] uppercase tracking-wider text-ac-muted">Bag</div>
          <div>{data.bag_descriptor}</div>
        </div>
        <div className="col-span-2">
          <div className="text-[11px] uppercase tracking-wider text-ac-muted">Expected delivery</div>
          <div>{data.expected_delivery_window}</div>
        </div>
      </div>
    </CardWrapper>
  );
}

export function BaggageAllowanceCard({
  data,
}: {
  data: {
    amount_cad: number;
    days: number;
    clause: string;
    rationale: string;
    notice_deadline_days: number;
    notice_clause: string;
  };
}) {
  return (
    <CardWrapper title="Interim-expense allowance" accent="amber">
      <div className="flex items-baseline gap-3">
        <div className="font-serif text-3xl font-bold">
          CAD ${data.amount_cad.toLocaleString()}
        </div>
        <div className="text-xs text-ac-muted">{data.clause}</div>
      </div>
      <div className="mt-2 text-sm text-ac-ink/80">
        <CitedText text={data.rationale} />
      </div>
      <div className="mt-3 rounded-md border border-ac-line bg-white p-2 text-xs text-ac-muted">
        <strong className="text-ac-ink">Heads up: </strong>
        File the written notice within {data.notice_deadline_days} days of receiving the bag, per {data.notice_clause}.
      </div>
    </CardWrapper>
  );
}

export function AeroplanProfileCard({
  data,
}: {
  data: {
    member_id: string;
    name: string;
    home_airport: string;
    current_tier: string;
    ytd_sqm: number;
    ytd_sqd_cad: number;
    ytd_segments: number;
    points_balance: number;
    typical_routes: string[];
    cards: string[];
  };
}) {
  return (
    <CardWrapper title={`Aeroplan profile · ${data.member_id}`} accent="mint">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="font-serif text-2xl font-bold">{data.name}</div>
          <div className="text-xs text-ac-muted">Home airport {data.home_airport}</div>
        </div>
        <div className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ac-mint ring-1 ring-ac-mint/40">
          {data.current_tier}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <Stat label="YTD SQM" value={data.ytd_sqm.toLocaleString()} />
        <Stat label="YTD SQD" value={`$${data.ytd_sqd_cad.toLocaleString()}`} />
        <Stat label="Segments" value={String(data.ytd_segments)} />
      </div>
      <div className="mt-3 text-xs">
        <div className="text-ac-muted">Points balance</div>
        <div className="font-semibold">{data.points_balance.toLocaleString()} pts</div>
      </div>
      <div className="mt-3 text-xs">
        <div className="text-ac-muted">Typical routes</div>
        <div>{data.typical_routes.join(" · ")}</div>
      </div>
    </CardWrapper>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ac-line bg-white p-2">
      <div className="text-[10px] uppercase tracking-wider text-ac-muted">{label}</div>
      <div className="font-semibold text-ac-ink">{value}</div>
    </div>
  );
}

export function AeroplanStatusPathCard({
  data,
}: {
  data: {
    current_tier: string;
    target_tier: string;
    sqm_gap: number;
    sqd_gap_cad: number;
    segment_gap: number;
    recommendation: string;
  };
}) {
  return (
    <CardWrapper title={`Status path: ${data.current_tier} → ${data.target_tier}`} accent="mint">
      <div className="grid grid-cols-3 gap-2 text-xs">
        <Stat label="SQM gap" value={data.sqm_gap.toLocaleString()} />
        <Stat label="SQD gap" value={`$${data.sqd_gap_cad.toLocaleString()}`} />
        <Stat label="Seg gap" value={String(data.segment_gap)} />
      </div>
      <pre className="mt-3 whitespace-pre-wrap rounded-md bg-white p-3 text-xs leading-relaxed text-ac-ink">
        {data.recommendation}
      </pre>
    </CardWrapper>
  );
}

export function AeroplanRedemptionsCard({
  data,
}: {
  data: {
    goal: string;
    options: {
      name: string;
      cents_per_point_value: string;
      note: string;
      points_one_way_economy_min?: number;
      points_one_way_economy_max?: number;
      points_one_way_business_min?: number;
      points_one_way_business_max?: number;
    }[];
  };
}) {
  return (
    <CardWrapper title={`Sweet-spot redemptions · ${data.goal}`} accent="mint">
      <div className="space-y-2">
        {data.options.map((o) => {
          const range =
            o.points_one_way_economy_min !== undefined
              ? `${o.points_one_way_economy_min.toLocaleString()}–${o.points_one_way_economy_max!.toLocaleString()} pts (Y)`
              : `${o.points_one_way_business_min!.toLocaleString()}–${o.points_one_way_business_max!.toLocaleString()} pts (J)`;
          return (
            <div
              key={o.name}
              className="rounded-md border border-ac-line bg-white p-3"
            >
              <div className="flex items-baseline justify-between">
                <div className="font-semibold text-ac-ink">{o.name}</div>
                <div className="text-xs text-ac-muted">~{o.cents_per_point_value} cpp</div>
              </div>
              <div className="mt-1 text-xs text-ac-muted">{range}</div>
              <div className="mt-1 text-xs text-ac-ink/80">{o.note}</div>
            </div>
          );
        })}
      </div>
    </CardWrapper>
  );
}

export function RebookingOptionsCard({
  data,
}: {
  data: {
    flight: {
      flight: string;
      origin: string;
      destination: string;
      status: string;
      cause_note: string;
    };
    cause_label: string;
    partners: string[];
    obligation_text: string;
    obligation_clause: string;
  };
}) {
  return (
    <CardWrapper title={`${data.flight.flight} alternates`} accent="ink">
      <div className="text-xs text-ac-muted">
        {data.flight.origin} → {data.flight.destination} · {data.flight.status} ·{" "}
        <span className="font-semibold text-ac-ink">{data.cause_label}</span>
      </div>
      <div className="mt-1 text-xs italic text-ac-muted">{data.flight.cause_note}</div>
      <ul className="mt-3 space-y-1 text-sm">
        {data.partners.map((p) => (
          <li
            key={p}
            className="rounded-md border border-ac-line bg-white px-3 py-1.5 text-ac-ink"
          >
            {p}
          </li>
        ))}
      </ul>
      <div className="mt-3 rounded-md border border-ac-line bg-white p-3 text-xs">
        <div className="font-semibold text-ac-ink">Carrier obligation</div>
        <div className="mt-1 text-ac-ink/80">
          <CitedText text={`${data.obligation_text} [${data.obligation_clause}]`} />
        </div>
      </div>
    </CardWrapper>
  );
}

export function AgentScriptCard({
  data,
}: {
  data: { script: string; clause: string };
}) {
  return (
    <CardWrapper title="Phone-agent script" accent="ink">
      <pre className="whitespace-pre-wrap rounded-md bg-white p-3 text-sm leading-relaxed text-ac-ink">
        {data.script}
      </pre>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-ac-muted">{data.clause}</span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(data.script);
          }}
          className="rounded-md border border-ac-line bg-white px-2.5 py-1 font-medium text-ac-ink hover:bg-ac-paper"
        >
          Copy script
        </button>
      </div>
    </CardWrapper>
  );
}

export function HandoffCard({
  data,
}: {
  data: { reason: string; severity: "low" | "medium" | "high" };
}) {
  const sev = {
    low: "border-ac-line bg-white text-ac-muted",
    medium: "border-ac-amber/40 bg-ac-amber/10 text-ac-amber",
    high: "border-ac-red/40 bg-ac-red/10 text-ac-red",
  }[data.severity];
  return (
    <div className={`mt-3 rounded-xl border p-3 text-sm ${sev}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wider">
        Flagged for human handoff · severity {data.severity}
      </div>
      <div className="mt-1">{data.reason}</div>
    </div>
  );
}

export function ToolCard({
  card,
}: {
  card: { kind: string; data: Record<string, unknown> };
}) {
  switch (card.kind) {
    case "compensation":
      return <CompensationCard data={card.data as never} />;
    case "claim_letter":
      return <ClaimLetterCard data={card.data as never} />;
    case "baggage_status":
      return <BaggageStatusCard data={card.data as never} />;
    case "baggage_allowance":
      return <BaggageAllowanceCard data={card.data as never} />;
    case "aeroplan_profile":
      return <AeroplanProfileCard data={card.data as never} />;
    case "aeroplan_status_path":
      return <AeroplanStatusPathCard data={card.data as never} />;
    case "aeroplan_redemptions":
      return <AeroplanRedemptionsCard data={card.data as never} />;
    case "rebooking_options":
      return <RebookingOptionsCard data={card.data as never} />;
    case "agent_script":
      return <AgentScriptCard data={card.data as never} />;
    case "handoff":
      return <HandoffCard data={card.data as never} />;
    default:
      return null;
  }
}
