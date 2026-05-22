"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Overview" },
  { href: "/identity", label: "Agent Identity" },
  { href: "/jobs", label: "Trade Console" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-gray-800 bg-gray-950/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-4 lg:gap-8">
        <div className="flex items-center gap-2 min-w-0">
          {/* Arc-inspired logo mark */}
          <span className="text-blue-400 font-bold text-lg">⬡</span>
          <span className="font-semibold text-white tracking-tight truncate">
            Arc Trade Agent Settlement
          </span>
          <span className="ml-2 px-2 py-0.5 rounded text-xs bg-blue-900/60 text-blue-300 border border-blue-700">
            Testnet MVP
          </span>
        </div>

        <nav className="flex flex-wrap gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                pathname === href
                  ? "bg-blue-700 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="px-2 py-1 rounded text-xs bg-gray-800 text-gray-400 border border-gray-700">
            USDC on Arc
          </span>
          <a
            href="https://testnet.arcscan.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:underline"
          >
            Arcscan ↗
          </a>
        </div>
      </div>
    </header>
  );
}
