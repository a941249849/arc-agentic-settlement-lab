"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useArcWallet } from "./ArcWalletProvider";

const NAV_LINKS = [
  { href: "/", label: "Overview" },
  { href: "/jobs", label: "Deal Room" },
  { href: "/identity", label: "Agent Proof" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const {
    wallets,
    selectedWalletId,
    selectedWallet,
    setSelectedWalletId,
    account,
    chainId,
    arcChainIdHex,
    isArcNetwork,
    running,
    error,
    connectWallet,
    switchToArcNetwork,
    addArcNetwork,
    clearError,
  } = useArcWallet();

  const walletLabel = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect wallet";

  async function handleConnect() {
    clearError();
    await connectWallet().catch(() => undefined);
  }

  return (
    <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-4 lg:gap-8">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-emerald-400 text-sm font-bold text-slate-950 shadow-md shadow-sky-500/15">
            A
          </span>
          <span className="font-semibold text-slate-100 tracking-tight truncate">
            Arc Escrow Deal Room
          </span>
          <span className="ml-2 px-2 py-0.5 rounded-lg text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Testnet
          </span>
        </div>

        <nav className="flex flex-wrap gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 border ${
                pathname === href
                  ? "bg-sky-500/10 text-sky-450 border-sky-500/20 font-medium shadow-sm"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/50 border-transparent"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="px-2 py-1 rounded-lg text-xs bg-slate-900 text-slate-400 border border-slate-800">
            USDC on Arc
          </span>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((value) => !value)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                account && isArcNetwork
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-sm shadow-emerald-500/5"
                  : "border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {running === "connect"
                ? "Connecting..."
                : running === "switch"
                ? "Switching..."
                : running === "add"
                ? "Adding Arc..."
                : walletLabel}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg border border-slate-800 bg-slate-950/95 p-4 text-sm shadow-2xl backdrop-blur-xl">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-100">Wallet</div>
                    <div className="mt-1 text-xs text-slate-400">
                      OKX Wallet and MetaMask are supported. The app will add or switch to Arc Testnet before signing.
                    </div>
                  </div>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-3">
                  {wallets.length > 0 && (
                    <label className="block space-y-1 text-xs font-medium text-slate-400">
                      Wallet provider
                      <select
                        value={selectedWalletId}
                        onChange={(event) => setSelectedWalletId(event.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                      >
                        {wallets.map((wallet) => (
                          <option key={wallet.info.uuid} value={wallet.info.uuid}>
                            {wallet.info.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  <div className="rounded-lg border border-slate-900 bg-slate-900/40 p-3 text-xs space-y-2">
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">Provider</span>
                      <span className="font-semibold text-slate-100">
                        {selectedWallet?.info.name ?? "Not detected"}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between gap-3">
                      <span className="text-slate-500">Account</span>
                      <span className="font-mono text-slate-300 truncate block max-w-[180px]" title={account ?? ""}>
                        {account ?? "Not connected"}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between gap-3">
                      <span className="text-slate-500">Network</span>
                      <span className={isArcNetwork ? "font-semibold text-emerald-450" : "font-semibold text-amber-450"}>
                        {isArcNetwork ? "Arc Testnet" : chainId ?? "Unknown"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleConnect}
                    disabled={running !== null}
                    className="w-full rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors shadow-lg shadow-sky-500/20"
                  >
                    {account
                      ? isArcNetwork
                        ? "Wallet ready"
                        : "Connect and switch to Arc"
                      : "Connect wallet"}
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => switchToArcNetwork().catch(() => undefined)}
                      disabled={running !== null}
                      className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-400 hover:bg-sky-500/20 disabled:opacity-50 transition-colors"
                    >
                      Switch to Arc
                    </button>
                    <button
                      onClick={() => addArcNetwork().catch(() => undefined)}
                      disabled={running !== null}
                      className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50 transition-colors"
                    >
                      Add Arc
                    </button>
                  </div>

                  {chainId && chainId.toLowerCase() !== arcChainIdHex.toLowerCase() && (
                    <p className="text-xs text-amber-500">
                      Current wallet network is not Arc Testnet. Use Connect or Switch before signing.
                    </p>
                  )}

                  {error && <p className="break-words text-xs text-red-400">{error}</p>}
                </div>
              </div>
            )}
          </div>
          <a
            href="https://testnet.arcscan.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-400 hover:text-emerald-350 hover:underline transition-colors"
          >
            Arcscan
          </a>
        </div>
      </div>
    </header>
  );
}
