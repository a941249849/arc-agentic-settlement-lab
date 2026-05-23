import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ArcWalletProvider } from "@/components/ArcWalletProvider";

export const metadata: Metadata = {
  title: "Arc Trade Agent Settlement",
  description:
    "SME cross-border trade settlement on Arc: agent identity, USDC escrow, deliverable proof, and auditable receipts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#f7f9f8] text-slate-950 font-sans">
        <ArcWalletProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200">
            Arc Settlement Workspace · Arc Testnet · Not financial advice
          </footer>
        </ArcWalletProvider>
      </body>
    </html>
  );
}
