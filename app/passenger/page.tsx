import Link from "next/link";
import { Chat } from "@/components/Chat";

export default function PassengerPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-ac-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-ac-red" />
            <span className="font-serif text-lg font-bold text-ac-ink">
              Care Copilot
            </span>
            <span className="hidden text-xs text-ac-muted md:inline">
              · passenger chat
            </span>
          </Link>
          <nav className="flex items-center gap-3 text-xs">
            <Link
              href="/ops"
              className="rounded-full border border-ac-line px-3 py-1.5 font-medium text-ac-ink hover:border-ac-ink"
            >
              Ops view →
            </Link>
          </nav>
        </div>
      </header>
      <Chat />
    </div>
  );
}
