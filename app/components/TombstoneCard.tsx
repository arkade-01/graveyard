import Link from "next/link";
import Image from "next/image";
import { CauseBadge } from "./CauseBadge";
import { DeathScoreMeter } from "./DeathScoreMeter";
import type { GraveyardToken } from "@/app/api/graveyard/route";

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtPrice(n: number) {
  if (n === 0) return "$0.00";
  if (n < 0.000001) return `$${n.toExponential(2)}`;
  if (n < 0.01) return `$${n.toFixed(6)}`;
  return `$${n.toFixed(4)}`;
}

export function TombstoneCard({ token }: { token: GraveyardToken }) {
  const { death, symbol, name, address, logoURI } = token;

  return (
    <Link href={`/token/${address}`} className="block group">
      <div className="tombstone-card rounded-xl p-5 space-y-4 h-full flex flex-col group-hover:border-zinc-600 transition-colors cursor-pointer">
        {/* RIP header */}
        <div className="text-center space-y-1 relative z-10">
          <p className="font-gothic text-zinc-500 text-sm tracking-widest">
            ✝ R.I.P ✝
          </p>
          <h2 className="font-gothic text-2xl text-white tracking-wide">
            ${symbol}
          </h2>
          <p className="text-zinc-500 text-xs truncate">{name}</p>
          {logoURI && (
            <div className="flex justify-center pt-1">
              <Image
                src={logoURI}
                alt={symbol}
                width={32}
                height={32}
                className="rounded-full opacity-60"
                unoptimized
              />
            </div>
          )}
        </div>

        {/* Cause badge */}
        <div className="flex justify-center relative z-10">
          <CauseBadge cause={death.cause} />
        </div>

        {/* Death score */}
        <div className="relative z-10">
          <DeathScoreMeter score={death.deathScore} />
        </div>

        {/* Price stats */}
        <div className="text-xs text-zinc-400 space-y-1 relative z-10">
          <div className="flex justify-between">
            <span>Peak</span>
            <span className="font-mono text-zinc-300">
              {fmtPrice(death.peakPrice)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Now</span>
            <span className="font-mono text-red-400">
              {fmtPrice(death.currentPrice)}
            </span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Lost</span>
            <span className="font-mono text-red-500">
              −{death.percentLost.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Est. USD lost */}
        {death.estimatedLost > 0 && (
          <div className="text-center text-xs text-zinc-600 relative z-10">
            ≈ {fmt(death.estimatedLost)} lost from peak
          </div>
        )}

        {/* Epitaph */}
        <p className="text-xs italic text-zinc-500 text-center border-t border-zinc-800 pt-3 mt-auto relative z-10 leading-relaxed">
          &ldquo;{death.epitaph}&rdquo;
        </p>

        {/* View autopsy */}
        <div className="text-center relative z-10">
          <span className="text-xs text-zinc-600 group-hover:text-zinc-400 transition-colors underline underline-offset-2">
            View Autopsy →
          </span>
        </div>
      </div>
    </Link>
  );
}
