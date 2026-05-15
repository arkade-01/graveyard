"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, Table2 } from "lucide-react";
import { TombstoneCard } from "./TombstoneCard";
import { CauseBadge } from "./CauseBadge";
import { DeathScoreMeter } from "./DeathScoreMeter";
import type { GraveyardResponse } from "@/app/lib/graveyard";

function fmtUSD(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtPrice(n: number) {
  if (n === 0) return "$0.00";
  if (n < 0.000001) return `$${n.toExponential(2)}`;
  if (n < 0.01) return `$${n.toFixed(6)}`;
  return `$${n.toFixed(4)}`;
}

const CAUSE_LABELS: Record<string, string> = {
  RUG_PULL: "Rug Pull",
  ABANDONED: "Abandoned",
  WHALE_EXIT: "Whale Exit",
  NATURAL_DEATH: "Natural Death",
};

export function GraveyardClient({ data }: { data: GraveyardResponse }) {
  const [view, setView] = useState<"grid" | "table">("grid");

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-white font-mono">
            {data.totalBuried}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">Tokens Buried</p>
        </div>
        <div className="text-center border-x border-zinc-800">
          <p className="text-2xl font-bold text-red-400 font-mono">
            {fmtUSD(data.totalUSDLost)}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">Total USD Lost</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-zinc-300 mt-1">
            {CAUSE_LABELS[data.mostCommonCause] ?? data.mostCommonCause}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">Most Common Cause</p>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setView("grid")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${view === "grid" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          <LayoutGrid size={14} /> Grid
        </button>
        <button
          onClick={() => setView("table")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${view === "table" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          <Table2 size={14} /> Table
        </button>
      </div>

      {/* Grid view */}
      {view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.tokens.map((token) => (
            <TombstoneCard key={token.address} token={token} />
          ))}
        </div>
      )}

      {/* Table view */}
      {view === "table" && (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-xs">
                <th className="text-left p-3">Token</th>
                <th className="text-left p-3">Cause</th>
                <th className="text-right p-3">Death Score</th>
                <th className="text-right p-3">Peak Price</th>
                <th className="text-right p-3">Current</th>
                <th className="text-right p-3">% Lost</th>
                <th className="text-right p-3">Est. Lost</th>
                <th className="text-left p-3 max-w-xs">Epitaph</th>
              </tr>
            </thead>
            <tbody>
              {data.tokens.map((token, i) => (
                <tr
                  key={token.address}
                  className={`border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors ${i % 2 === 0 ? "bg-transparent" : "bg-zinc-950/30"}`}
                >
                  <td className="p-3">
                    <Link
                      href={`/token/${token.address}`}
                      className="flex items-center gap-2 hover:text-white transition-colors"
                    >
                      <span className="font-mono font-bold text-zinc-200">
                        ${token.symbol}
                      </span>
                      <span className="text-zinc-600 text-xs hidden sm:block truncate max-w-24">
                        {token.name}
                      </span>
                    </Link>
                  </td>
                  <td className="p-3">
                    <CauseBadge cause={token.death.cause} />
                  </td>
                  <td className="p-3 text-right">
                    <div className="w-20 ml-auto">
                      <DeathScoreMeter score={token.death.deathScore} />
                    </div>
                  </td>
                  <td className="p-3 text-right font-mono text-zinc-400 text-xs">
                    {fmtPrice(token.death.peakPrice)}
                  </td>
                  <td className="p-3 text-right font-mono text-red-400 text-xs">
                    {fmtPrice(token.death.currentPrice)}
                  </td>
                  <td className="p-3 text-right font-mono text-red-500 font-bold text-xs">
                    −{token.death.percentLost.toFixed(1)}%
                  </td>
                  <td className="p-3 text-right font-mono text-zinc-500 text-xs">
                    {fmtUSD(token.death.estimatedLost)}
                  </td>
                  <td className="p-3 text-xs italic text-zinc-500 max-w-xs">
                    <span className="line-clamp-2">{token.death.epitaph}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
