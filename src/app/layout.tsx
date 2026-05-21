import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Arc Agentic Settlement Lab",
  description:
    "Agent-native financial workflow on Arc: job creation → USDC escrow → deliverable proof → evaluator approval → settlement receipt.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100 font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="py-4 text-center text-xs text-gray-600 border-t border-gray-800">
          Arc Agentic Settlement Lab · Phase 1/2 · Offchain Simulation · Not financial advice
        </footer>
      </body>
    </html>
  );
}
