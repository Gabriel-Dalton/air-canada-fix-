import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Air Canada Care Copilot",
  description:
    "A grounded, citation-backed AI passenger-care copilot for Air Canada. Disruption rights, baggage recovery, Aeroplan optimization, and rebooking — in one chat.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
