import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ArcWalletProvider } from "@/components/ArcWalletProvider";

export const metadata: Metadata = {
  title: "ArcEscrow - Agentic Letter of Credit",
  description:
    "Agentic Letter of Credit for cross-border SME trade: USDC escrow, Arc agent proof, delivery evidence, evaluator approval, and auditable receipts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-slate-100 font-sans antialiased">
        <ArcWalletProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-900 bg-black/10 backdrop-blur-sm">
            ArcEscrow · Agentic Letter of Credit · Arc Testnet · Not financial advice
          </footer>
        </ArcWalletProvider>
      </body>
    </html>
  );
}
