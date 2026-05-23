"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useArcWallet } from "./ArcWalletProvider";

const NAV_LINKS = [
  { href: "/", label: "Overview" },
  { href: "/identity", label: "Agent Identity" },
  { href: "/jobs", label: "Settlement Workspace" },
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
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-4 lg:gap-8">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white">
            A
          </span>
          <span className="font-semibold text-slate-950 tracking-tight truncate">
            Arc Settlement Workspace
          </span>
          <span className="ml-2 px-2 py-0.5 rounded-lg text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
            Testnet
          </span>
        </div>

        <nav className="flex flex-wrap gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                pathname === href
                  ? "bg-slate-950 text-white"
                  : "text-slate-500 hover:text-slate-950 hover:bg-slate-100"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="px-2 py-1 rounded-lg text-xs bg-slate-100 text-slate-600 border border-slate-200">
            USDC on Arc
          </span>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((value) => !value)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                account && isArcNetwork
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
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
              <div className="absolute right-0 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-xl">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-950">Wallet</div>
                    <div className="mt-1 text-xs text-slate-500">
                      Connect once. The app will add or switch to Arc Testnet automatically.
                    </div>
                  </div>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-3">
                  {wallets.length > 0 && (
                    <label className="block space-y-1 text-xs font-medium text-slate-500">
                      Wallet provider
                      <select
                        value={selectedWalletId}
                        onChange={(event) => setSelectedWalletId(event.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                      >
                        {wallets.map((wallet) => (
                          <option key={wallet.info.uuid} value={wallet.info.uuid}>
                            {wallet.info.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs">
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">Provider</span>
                      <span className="font-semibold text-slate-900">
                        {selectedWallet?.info.name ?? "Not detected"}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between gap-3">
                      <span className="text-slate-500">Account</span>
                      <span className="font-mono text-slate-900">{account ?? "Not connected"}</span>
                    </div>
                    <div className="mt-2 flex justify-between gap-3">
                      <span className="text-slate-500">Network</span>
                      <span className={isArcNetwork ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>
                        {isArcNetwork ? "Arc Testnet" : chainId ?? "Unknown"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleConnect}
                    disabled={running !== null}
                    className="w-full rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
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
                      className="rounded-lg border border-sky-200 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-50 disabled:opacity-50"
                    >
                      Switch to Arc
                    </button>
                    <button
                      onClick={() => addArcNetwork().catch(() => undefined)}
                      disabled={running !== null}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Add Arc
                    </button>
                  </div>

                  {chainId && chainId.toLowerCase() !== arcChainIdHex.toLowerCase() && (
                    <p className="text-xs text-amber-700">
                      Current wallet network is not Arc Testnet. Use Connect or Switch before signing.
                    </p>
                  )}

                  {error && <p className="break-words text-xs text-red-600">{error}</p>}
                </div>
              </div>
            )}
          </div>
          <a
            href="https://testnet.arcscan.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-700 hover:underline"
          >
            Arcscan ↗
          </a>
        </div>
      </div>
    </header>
  );
}
