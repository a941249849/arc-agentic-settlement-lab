import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ArcWalletProvider } from "@/components/ArcWalletProvider";

export const metadata: Metadata = {
  title: "Arc Trade Agent Settlement",
  description:
    "Proof-gated USDC escrow on Arc: deal rooms, agent proof, delivery evidence, evaluator approval, and auditable receipts.",
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
            Arc Escrow Deal Room · Arc Testnet · Not financial advice
          </footer>
        </ArcWalletProvider>
      </body>
    </html>
  );
}
