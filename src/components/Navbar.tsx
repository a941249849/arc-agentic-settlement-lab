"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Overview" },
  { href: "/identity", label: "Agent Identity" },
  { href: "/jobs", label: "Settlement Workspace" },
];

export default function Navbar() {
  const pathname = usePathname();

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
