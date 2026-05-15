import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CauseBadge } from "@/app/components/CauseBadge";
import { DeathScoreMeter } from "@/app/components/DeathScoreMeter";
import { PriceChart, VolumeChart, DeathScoreBreakdown } from "@/app/components/AutopsyCharts";
import { ShareButton } from "@/app/components/ShareButton";
import type { AutopsyResponse } from "@/app/api/token/[address]/autopsy/route";

async function getAutopsy(address: string): Promise<AutopsyResponse> {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ??
    `http://localhost:${process.env.PORT ?? 3000}`;
  const res = await fetch(`${base}/api/token/${address}/autopsy`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load autopsy");
  return res.json() as Promise<AutopsyResponse>;
}

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

function scoreFactors(death: AutopsyResponse["death"], overview: AutopsyResponse["overview"]) {
  return [
    {
      label: "Volume collapse",
      value: overview.v24hUSD < 100 ? 30 : overview.v24hUSD < 500 ? 20 : overview.v24hUSD < 1000 ? 10 : 0,
      max: 30,
    },
    {
      label: "Liquidity drain",
      value: overview.liquidity < 1000 ? 30 : overview.liquidity < 2000 ? 20 : overview.liquidity < 5000 ? 10 : 0,
      max: 30,
    },
    {
      label: "Price collapse",
      value: death.percentLost >= 99 ? 25 : death.percentLost >= 95 ? 15 : death.percentLost >= 90 ? 10 : 0,
      max: 25,
    },
    {
      label: "Holder exodus",
      value: overview.holder < 10 ? 15 : overview.holder < 25 ? 10 : overview.holder < 50 ? 5 : 0,
      max: 15,
    },
  ];
}

export default async function AutopsyPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;

  let data: AutopsyResponse;
  try {
    data = await getAutopsy(address);
  } catch {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="font-gothic text-4xl text-zinc-600">Token not found</p>
          <Link href="/" className="text-zinc-500 hover:text-zinc-300 underline text-sm">
            ← Back to Graveyard
          </Link>
        </div>
      </main>
    );
  }

  const { death, overview, ohlcv, symbol, name, logoURI } = data;
  const factors = scoreFactors(death, overview);

  return (
    <main className="min-h-screen px-4 py-10 max-w-4xl mx-auto space-y-8">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-zinc-300 text-sm transition-colors"
      >
        <ArrowLeft size={14} /> Back to Graveyard
      </Link>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          {logoURI && (
            <Image
              src={logoURI}
              alt={symbol}
              width={56}
              height={56}
              className="rounded-full opacity-80"
              unoptimized
            />
          )}
          <div>
            <h1 className="font-gothic text-4xl text-white">
              ${symbol}
            </h1>
            <p className="text-zinc-500 text-sm">{name}</p>
            <p className="text-zinc-700 text-xs font-mono mt-0.5 break-all">
              {address}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <CauseBadge cause={death.cause} size="lg" />
          <ShareButton
            symbol={symbol}
            cause={death.cause}
            percentLost={death.percentLost}
          />
        </div>

        <p className="italic text-zinc-400 text-base border-l-2 border-zinc-700 pl-4">
          &ldquo;{death.epitaph}&rdquo;
        </p>
      </div>

      {/* Overall death score */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
        <h2 className="text-xs text-zinc-500 uppercase tracking-widest">
          Overall Death Score
        </h2>
        <DeathScoreMeter score={death.deathScore} />
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Peak Price", value: fmtPrice(death.peakPrice), color: "text-zinc-200" },
          { label: "Current Price", value: fmtPrice(death.currentPrice), color: "text-red-400" },
          { label: "% Lost", value: `−${death.percentLost.toFixed(1)}%`, color: "text-red-500" },
          { label: "Est. USD Lost", value: fmt(death.estimatedLost), color: "text-orange-400" },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-center"
          >
            <p className={`text-lg font-mono font-bold ${m.color}`}>{m.value}</p>
            <p className="text-xs text-zinc-600 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* When it peaked / started dying */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-1">
        <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-3">
          Timeline
        </h2>
        <div className="flex items-center gap-3 text-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
          <span className="text-zinc-500">Peak price era:</span>
          <span className="font-mono text-zinc-300">
            {ohlcv.length > 0
              ? new Date(
                  ohlcv.reduce((m, c) => (c.h > m.h ? c : m), ohlcv[0])
                    .unixTime * 1000
                ).toLocaleDateString()
              : "Unknown"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          <span className="text-zinc-500">Estimated time of death:</span>
          <span className="font-mono text-zinc-300">
            {new Date(death.timeOfDeath).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Price collapse chart */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
        <h2 className="text-xs text-zinc-500 uppercase tracking-widest">
          Price Collapse (30d)
        </h2>
        <PriceChart ohlcv={ohlcv} />
      </div>

      {/* Volume flatline chart */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
        <h2 className="text-xs text-zinc-500 uppercase tracking-widest">
          Volume Flatline (30d)
        </h2>
        <VolumeChart ohlcv={ohlcv} />
      </div>

      {/* Live metrics */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
        <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-3">
          Live Metrics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          {[
            { label: "24h Volume", value: fmt(overview.v24hUSD) },
            { label: "Liquidity", value: fmt(overview.liquidity) },
            { label: "Holders", value: overview.holder.toLocaleString() },
            { label: "24h Change", value: `${overview.priceChange24hPercent?.toFixed(1) ?? "—"}%` },
            { label: "Market Cap", value: overview.marketCap ? fmt(overview.marketCap) : "—" },
          ].map((m) => (
            <div key={m.label}>
              <p className="text-zinc-600 text-xs">{m.label}</p>
              <p className="font-mono text-zinc-300 mt-0.5">{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Death score breakdown */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
        <h2 className="text-xs text-zinc-500 uppercase tracking-widest">
          Death Score Breakdown
        </h2>
        <DeathScoreBreakdown factors={factors} />
      </div>

      {/* Footer */}
      <div className="pb-20 text-center">
        <Link
          href="/"
          className="text-zinc-600 hover:text-zinc-400 text-xs underline transition-colors"
        >
          ← Return to the Graveyard
        </Link>
      </div>
    </main>
  );
}
