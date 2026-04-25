import Link from "next/link";

export default function LandingPage() {
  return (
    <main>
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ac-red">
          A pitch for Air Canada · concept demo
        </div>
        <h1 className="mt-4 font-serif text-5xl font-bold leading-[1.1] text-ac-ink md:text-6xl">
          The Care Copilot.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ac-ink/80">
          A grounded, citation-backed AI assistant for Air Canada passengers —
          built to fix the trust problem the 2024 chatbot incident created, and
          to give your operations team a real-time view of where the rage is
          coming from.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/passenger"
            className="rounded-full bg-ac-red px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ac-ink"
          >
            Try the passenger chat →
          </Link>
          <Link
            href="/ops"
            className="rounded-full border border-ac-line bg-white px-5 py-2.5 text-sm font-semibold text-ac-ink transition hover:border-ac-ink"
          >
            See the ops dashboard →
          </Link>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <Pillar
            kicker="Module 1"
            title="Disruption &amp; APPR"
            body="Diagnoses entitlement under the Air Passenger Protection Regulations, calculates compensation, drafts the formal claim. Cites the exact APPR section behind every dollar."
          />
          <Pillar
            kicker="Module 2"
            title="Baggage"
            body="Looks up World Tracer file references, computes the AC tariff interim-expense allowance, drafts a delayed-baggage claim that names Montreal Convention Article 22 — within the 21-day notice window."
          />
          <Pillar
            kicker="Module 3"
            title="Aeroplan"
            body="Profiles a member, projects status fast-track paths against published SQM/SQD thresholds, surfaces redemption sweet spots with cents-per-point math. Knows the SQD-waiver rules for co-branded cards."
          />
          <Pillar
            kicker="Module 4"
            title="Rebooking"
            body="Proposes alternate routings (including Star Alliance interlines under §17(1)) and generates a calm, policy-anchored phone-agent script the passenger can read verbatim."
          />
        </div>

        <section className="mt-14 rounded-2xl border border-ac-line bg-white p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ac-red">
            Why this is different from the 2024 chatbot
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ac-ink/90">
            <li>
              <strong>Cite-or-refuse.</strong> Every factual claim is anchored to
              a clause in the loaded knowledge block. If it can&apos;t be cited,
              the assistant refuses and offers a human handoff — no
              hallucinated bereavement-fare policies.
            </li>
            <li>
              <strong>Deterministic tools for the dollar amounts.</strong>{" "}
              Compensation, baggage allowance, and status-path math run through
              typed tool calls — not free-text generation. The model decides{" "}
              <em>when</em>, not <em>what</em>.
            </li>
            <li>
              <strong>Built-in escalation.</strong> The model has a
              flag-for-human-handoff tool it&apos;s prompted to use on rage,
              distress, or anything outside the knowledge base. The Ops view
              surfaces those conversations within seconds.
            </li>
          </ul>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <Stat number="3" label="weeks to a shadow-mode rollout" />
          <Stat number=">90%" label="cost savings on every cached follow-up turn" />
          <Stat
            number="0"
            label="ungrounded factual claims, by construction"
          />
        </section>

        <footer className="mt-16 border-t border-ac-line pt-6 text-xs text-ac-muted">
          Concept demo. Knowledge content is sourced from public CTA, Montreal
          Convention, and Air Canada tariff materials and is intended for
          illustration; production deployment must re-validate against current
          regulations and AC&apos;s live tariff filings before passenger-facing
          launch.
        </footer>
      </div>
    </main>
  );
}

function Pillar({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-ac-line bg-white p-6">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ac-muted">
        {kicker}
      </div>
      <div
        className="mt-2 font-serif text-2xl font-bold text-ac-ink"
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <div className="mt-2 text-sm leading-relaxed text-ac-ink/80">{body}</div>
    </div>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="rounded-2xl border border-ac-line bg-white p-6 text-center">
      <div className="font-serif text-4xl font-bold text-ac-ink">{number}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-ac-muted">
        {label}
      </div>
    </div>
  );
}
