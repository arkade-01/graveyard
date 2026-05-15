import { kv } from "@vercel/kv";
import {
  getTrendingTokens,
  getTokenOverview,
  getTopHolders,
  getRecentTxs,
} from "@/packages/birdeye";
import { classifyDeath, isDead } from "@/packages/classifier";
import type { DeathResult } from "@/packages/classifier";
import type { TokenOverview } from "@/packages/birdeye";

// ── Types ────────────────────────────────────────────────────────────────────

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

// ── Known dead Solana tokens (seed list) ─────────────────────────────────────

const DEAD_SEED: string[] = [
  "MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac", // MNGO — Mango Markets
  "EchesyfXePKdLtoiZSL8pBe8Myagyy8ZRqsACNCFGnvp", // FIDA — Bonfida
  "HZRCwxP2Vq9PCpPXooayhJ2bxTpo5xfpQrwB1svh332p", // LIKE — Only1
  "kinXdEcpDQeHPEuQnqmUgtYykqKGVFq6CeVX5iALJa8",  // KIN
  "SLRSSpSLUTP7okbCUBYStWCo1vUgyt775faPqz8HUMr",  // SLRS — Solrise
  "ETAtLmCmsoiEEKfNrHKJ2kYy3MoABhU6NQvpSfij5tDs", // MEDIA — Media Network
  "8HGyAAB1yoM1ttS7pXjHMa3dukTFGQggnFFH3hJZgzQh", // COPE
  "StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT",  // STEP — Step Finance
  "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", // RAY — Raydium (very low vol)
  "7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx", // GENE — Genopets
];

const CACHE_KEY = "graveyard:v1";
const CACHE_TTL_SECONDS = 5 * 60; // 5 minutes

// ── Helpers ───────────────────────────────────────────────────────────────────

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

async function fetchGraveyard(): Promise<GraveyardResponse> {
  let candidateAddresses: string[] = [];
  try {
    const trending = await getTrendingTokens();
    candidateAddresses = trending
      .filter((t) => t.volume24hUSD < 5_000 || t.liquidity < 10_000)
      .map((t) => t.address);
  } catch {
    // fall through to seed list only
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

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET() {
  // Try KV first; fall back to in-memory if KV env vars aren't configured.
  try {
    const cached = await kv.get<GraveyardResponse>(CACHE_KEY);
    if (cached) return Response.json(cached);
  } catch {
    // KV not available locally — that's fine, continue to fetch.
  }

  try {
    const data = await fetchGraveyard();

    try {
      await kv.set(CACHE_KEY, data, { ex: CACHE_TTL_SECONDS });
    } catch {
      // KV write failed (e.g. no env vars locally) — serve the data anyway.
    }

    return Response.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
