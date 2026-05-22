import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Arc Agentic Commerce Settlement",
  description:
    "Agent service payment workflow on Arc: identity, budgeted USDC escrow, deliverable proof, and settlement receipts.",
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
          Arc Agentic Commerce Settlement · Arc Testnet · Not financial advice
        </footer>
      </body>
    </html>
  );
}
