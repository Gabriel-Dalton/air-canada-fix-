import type { SkillModule } from "@/lib/store";

const STYLE: Record<
  SkillModule,
  { label: string; ring: string; bg: string; text: string; dot: string }
> = {
  disruption: {
    label: "Disruption & APPR",
    ring: "ring-ac-red/30",
    bg: "bg-ac-red/5",
    text: "text-ac-red",
    dot: "bg-ac-red",
  },
  baggage: {
    label: "Baggage",
    ring: "ring-ac-amber/30",
    bg: "bg-ac-amber/5",
    text: "text-ac-amber",
    dot: "bg-ac-amber",
  },
  aeroplan: {
    label: "Aeroplan",
    ring: "ring-ac-mint/30",
    bg: "bg-ac-mint/5",
    text: "text-ac-mint",
    dot: "bg-ac-mint",
  },
  rebooking: {
    label: "Rebooking",
    ring: "ring-ac-ink/20",
    bg: "bg-ac-ink/5",
    text: "text-ac-ink",
    dot: "bg-ac-ink",
  },
  general: {
    label: "General",
    ring: "ring-ac-muted/30",
    bg: "bg-white",
    text: "text-ac-muted",
    dot: "bg-ac-muted",
  },
};

export function ModuleBadge({ module }: { module: SkillModule }) {
  const s = STYLE[module];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${s.ring} ${s.bg} ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
