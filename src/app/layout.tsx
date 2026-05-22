import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Arc Agentic Commerce Settlement",
  description:
    "Stablecoin commerce stack MVP on Arc: agent identity, budgeted USDC escrow, deliverable proof, settlement receipts, and Circle product feedback.",
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
          Arc Agentic Commerce Settlement · Challenge MVP · Arc Testnet · Not financial advice
        </footer>
      </body>
    </html>
  );
}
