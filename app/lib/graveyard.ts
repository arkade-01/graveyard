import { unstable_cache } from "next/cache";
import {
  getTrendingTokens,
  getTokenOverview,
  getTopHolders,
  getRecentTxs,
} from "@/packages/birdeye";
import { classifyDeath, isDead } from "@/packages/classifier";
import type { DeathResult } from "@/packages/classifier";
import type { TokenOverview } from "@/packages/birdeye";

export interface GraveyardToken {
  address: string;
  symbol: string;
  name: string;
  logoURI: string | null;
  overview: TokenOverview;
  death: DeathResult;
}

export interface GraveyardResponse {
  tokens: GraveyardToken[];
  totalBuried: number;
  totalUSDLost: number;
  mostCommonCause: string;
  cachedAt: number;
}

const DEAD_SEED: string[] = [
  "MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac",
  "EchesyfXePKdLtoiZSL8pBe8Myagyy8ZRqsACNCFGnvp",
  "HZRCwxP2Vq9PCpPXooayhJ2bxTpo5xfpQrwB1svh332p",
  "kinXdEcpDQeHPEuQnqmUgtYykqKGVFq6CeVX5iALJa8",
  "SLRSSpSLUTP7okbCUBYStWCo1vUgyt775faPqz8HUMr",
  "ETAtLmCmsoiEEKfNrHKJ2kYy3MoABhU6NQvpSfij5tDs",
  "8HGyAAB1yoM1ttS7pXjHMa3dukTFGQggnFFH3hJZgzQh",
  "StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT",
  "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
  "7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function enrichToken(address: string): Promise<GraveyardToken | null> {
  try {
    const overview = await getTokenOverview(address);
    if (!overview.symbol || overview.v24hUSD == null || overview.holder == null)
      return null;
    if (!isDead(overview, overview.price)) return null;

    await sleep(120);
    const [holdersResult, txsResult] = await Promise.allSettled([
      getTopHolders(address),
      getRecentTxs(address),
    ]);

    const holders =
      holdersResult.status === "fulfilled" ? holdersResult.value : [];
    const txs = txsResult.status === "fulfilled" ? txsResult.value : [];
    const death = classifyDeath(overview, holders, txs, []);

    return {
      address,
      symbol: overview.symbol,
      name: overview.name,
      logoURI: overview.logoURI,
      overview,
      death,
    };
  } catch {
    return null;
  }
}

async function fetchGraveyardData(): Promise<GraveyardResponse> {
  let candidateAddresses: string[] = [];
  try {
    const trending = await getTrendingTokens();
    candidateAddresses = trending
      .filter((t) => t.volume24hUSD < 5_000 || t.liquidity < 10_000)
      .map((t) => t.address);
  } catch {
    // fall through to seed list
  }

  const allAddresses = [...new Set([...candidateAddresses, ...DEAD_SEED])];

  const dead: GraveyardToken[] = [];
  for (const address of allAddresses) {
    await sleep(350);
    const token = await enrichToken(address);
    if (token) dead.push(token);
  }

  dead.sort((a, b) => b.death.deathScore - a.death.deathScore);
  const tokens = dead.slice(0, 20);

  const totalUSDLost = tokens.reduce((sum, t) => sum + t.death.estimatedLost, 0);
  const causeCounts = tokens.reduce<Record<string, number>>((acc, t) => {
    acc[t.death.cause] = (acc[t.death.cause] ?? 0) + 1;
    return acc;
  }, {});
  const mostCommonCause =
    Object.entries(causeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "NATURAL_DEATH";

  return {
    tokens,
    totalBuried: tokens.length,
    totalUSDLost,
    mostCommonCause,
    cachedAt: Date.now(),
  };
}

// Cached wrapper — fills lazily on first request, never at build time.
export const getGraveyardData = unstable_cache(
  fetchGraveyardData,
  ["graveyard-data"],
  { revalidate: 300 }
);
