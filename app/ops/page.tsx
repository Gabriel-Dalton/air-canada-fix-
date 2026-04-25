import Link from "next/link";
import { OpsDashboard } from "@/components/OpsDashboard";

export default function OpsPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-ac-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-ac-red" />
            <span className="font-serif text-lg font-bold text-ac-ink">
              Care Copilot
            </span>
            <span className="hidden text-xs text-ac-muted md:inline">
              · ops view
            </span>
          </Link>
          <nav className="flex items-center gap-3 text-xs">
            <Link
              href="/passenger"
              className="rounded-full border border-ac-line px-3 py-1.5 font-medium text-ac-ink hover:border-ac-ink"
            >
              ← Passenger chat
            </Link>
          </nav>
        </div>
      </header>
      <OpsDashboard />
    </div>
  );
}
