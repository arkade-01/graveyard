import type {
  TokenOverview,
  HolderItem,
  TxItem,
  OHLCVItem,
} from "@/packages/birdeye";

export type CauseOfDeath =
  | "RUG_PULL"
  | "ABANDONED"
  | "WHALE_EXIT"
  | "NATURAL_DEATH";

export interface DeathResult {
  isDead: boolean;
  cause: CauseOfDeath;
  deathScore: number;
  peakPrice: number;
  currentPrice: number;
  percentLost: number;
  estimatedLost: number;
  timeOfDeath: string;
  epitaph: string;
}

// ── Death score ──────────────────────────────────────────────────────────────

function scoreVolume(volume: number): number {
  if (volume < 100) return 30;
  if (volume < 500) return 20;
  if (volume < 1_000) return 10;
  return 0;
}

function scoreLiquidity(liquidity: number): number {
  if (liquidity < 1_000) return 30;
  if (liquidity < 2_000) return 20;
  if (liquidity < 5_000) return 10;
  return 0;
}

function scorePriceDecline(percentLost: number): number {
  if (percentLost >= 99) return 25;
  if (percentLost >= 95) return 15;
  if (percentLost >= 90) return 10;
  return 0;
}

function scoreHolders(holders: number): number {
  if (holders < 10) return 15;
  if (holders < 25) return 10;
  if (holders < 50) return 5;
  return 0;
}

// ── Epitaphs ─────────────────────────────────────────────────────────────────

const epitaphs: Record<CauseOfDeath, (symbol: string) => string> = {
  RUG_PULL: (s) => {
    const lines = [
      `Here lies $${s}. Dev said "going to McDonalds". Never came back.`,
      `They took the liquidity and ran 🏃 $${s} never had a chance.`,
      `$${s} — the team had a vision. The vision was your money.`,
      `Liquidity: gone. Devs: gone. $${s}: gone. Coincidence? No.`,
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  },
  WHALE_EXIT: (s) => {
    const lines = [
      `Whales entered. Whales left. You stayed. 🐋 $${s} RIP.`,
      `Smart money found the exit. Retail found the bag. $${s}.`,
      `$${s} — the whales called it a "strategic repositioning".`,
      `They said "diamond hands". The whales said "goodbye". $${s}.`,
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  },
  ABANDONED: (s) => {
    const lines = [
      `The dev had "big plans". The plans had other plans. $${s}.`,
      `Last tweet was 47 days ago. 🦗 $${s} is silent forever.`,
      `$${s} — "utility coming soon". Soon never came.`,
      `The roadmap said Q4. It is now Q∞. $${s} rests here.`,
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  },
  NATURAL_DEATH: (s) => {
    const lines = [
      `It tried. It really did. 🕯️ $${s}.`,
      `Not every token was meant to make it. $${s} knew this.`,
      `$${s} — born in hype, died in silence. A beautiful tragedy.`,
      `Sometimes the market just says no. $${s} said yes anyway.`,
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  },
};

// ── Core classifier ──────────────────────────────────────────────────────────

export function isDead(overview: TokenOverview, peakPrice: number): boolean {
  const percentLost =
    peakPrice > 0
      ? ((peakPrice - overview.price) / peakPrice) * 100
      : 0;
  return (
    overview.v24hUSD < 1_000 ||
    overview.liquidity < 5_000 ||
    percentLost >= 90 ||
    overview.holder < 50
  );
}

export function classifyDeath(
  overview: TokenOverview,
  holders: HolderItem[],
  txs: TxItem[],
  ohlcv: OHLCVItem[]
): DeathResult {
  // Peak price from OHLCV history
  const peakPrice =
    ohlcv.length > 0 ? Math.max(...ohlcv.map((c) => c.h)) : overview.price;
  const currentPrice = overview.price;

  const percentLost =
    peakPrice > 0 ? ((peakPrice - currentPrice) / peakPrice) * 100 : 0;

  const estimatedLost =
    overview.marketCap != null ? overview.marketCap * (percentLost / 100) : 0;

  // Death score
  const deathScore = Math.min(
    100,
    scoreVolume(overview.v24hUSD) +
      scoreLiquidity(overview.liquidity) +
      scorePriceDecline(percentLost) +
      scoreHolders(overview.holder)
  );

  // Cause of death
  const topHolderConcentration = holders
    .slice(0, 5)
    .reduce((sum, h) => sum + h.percentage, 0);

  const buys = txs.filter((t) => t.side === "buy").length;
  const sells = txs.filter((t) => t.side === "sell").length;
  const buySellRatio = sells > 0 ? buys / sells : buys > 0 ? 1 : 0;

  let cause: CauseOfDeath;

  if (overview.liquidity < 5_000 * 0.2 && topHolderConcentration > 70) {
    cause = "RUG_PULL";
  } else if (buySellRatio < 0.2 && overview.v24hUSD > 0) {
    cause = "WHALE_EXIT";
  } else if (overview.v24hUSD < 500 && overview.holder < 100) {
    cause = "ABANDONED";
  } else {
    cause = "NATURAL_DEATH";
  }

  // Time of death — earliest OHLCV bar where volume dropped below 10% of peak vol
  const peakVol = ohlcv.length > 0 ? Math.max(...ohlcv.map((c) => c.v)) : 0;
  const dyingBar = ohlcv.find((c) => c.v < peakVol * 0.1 && c.v > 0);
  const timeOfDeath = dyingBar
    ? new Date(dyingBar.unixTime * 1000).toISOString()
    : new Date().toISOString();

  const epitaph = epitaphs[cause](overview.symbol);

  return {
    isDead: isDead(overview, peakPrice),
    cause,
    deathScore,
    peakPrice,
    currentPrice,
    percentLost,
    estimatedLost,
    timeOfDeath,
    epitaph,
  };
}
