const BASE_URL = "https://public-api.birdeye.so";

function headers(): HeadersInit {
  const key = process.env.BIRDEYE_API_KEY;
  if (!key) throw new Error("BIRDEYE_API_KEY is not set");
  return { "X-API-KEY": key, "x-chain": "solana" };
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function birdeyeFetch<T>(path: string, attempt = 0): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { headers: headers() });

  if (res.status === 429) {
    if (attempt >= 3) throw new Error(`Birdeye ${path} → 429 rate limited`);
    await sleep(1000 * 2 ** attempt); // 1s, 2s, 4s
    return birdeyeFetch<T>(path, attempt + 1);
  }

  if (!res.ok) {
    throw new Error(`Birdeye ${path} → ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as { success: boolean; data: T };
  if (!json.success) throw new Error(`Birdeye ${path} returned success=false`);
  return json.data;
}

// ── Types (field names match actual Birdeye API responses) ──────────────────

export interface TrendingToken {
  address: string;
  symbol: string;
  name: string;
  logoURI: string | null;
  volume24hUSD: number;
  liquidity: number;
  price: number;
  rank: number;
}

export interface TokenOverview {
  address: string;
  symbol: string;
  name: string;
  logoURI: string | null;
  price: number;
  liquidity: number;
  v24hUSD: number;
  holder: number;
  priceChange24hPercent: number;
  marketCap: number | null;
}

export interface HolderItem {
  owner: string;
  ui_amount: number;
  percentage: number; // computed after fetch
}

export interface TxItem {
  side: "buy" | "sell";
  volume_usd: number;
  block_unix_time: number;
}

export interface OHLCVItem {
  unixTime: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

// ── API calls ────────────────────────────────────────────────────────────────

export async function getTrendingTokens(): Promise<TrendingToken[]> {
  const data = await birdeyeFetch<{ tokens: TrendingToken[] }>(
    "/defi/token_trending?sort_by=rank&sort_type=asc&interval=24h&limit=20"
  );
  return data.tokens;
}

export async function getTokenOverview(address: string): Promise<TokenOverview> {
  return birdeyeFetch<TokenOverview>(`/defi/token_overview?address=${address}`);
}

interface RawHolder {
  owner: string;
  ui_amount: number;
}

export async function getTopHolders(address: string): Promise<HolderItem[]> {
  const data = await birdeyeFetch<{ items: RawHolder[] }>(
    `/defi/v3/token/holder?address=${address}&limit=20`
  );
  const items = data.items;
  const total = items.reduce((sum, h) => sum + h.ui_amount, 0);
  return items.map((h) => ({
    owner: h.owner,
    ui_amount: h.ui_amount,
    percentage: total > 0 ? (h.ui_amount / total) * 100 : 0,
  }));
}

interface RawTx {
  side: "buy" | "sell";
  volume_usd: number;
  block_unix_time: number;
}

export async function getRecentTxs(address: string): Promise<TxItem[]> {
  const data = await birdeyeFetch<{ items: RawTx[] }>(
    `/defi/v3/token/txs?address=${address}&limit=50`
  );
  return data.items.map((t) => ({
    side: t.side,
    volume_usd: t.volume_usd,
    block_unix_time: t.block_unix_time,
  }));
}

export async function getOHLCV(
  address: string,
  timeFrom: number,
  timeTo: number
): Promise<OHLCVItem[]> {
  const data = await birdeyeFetch<{ items: OHLCVItem[] }>(
    `/defi/ohlcv?address=${address}&type=1H&time_from=${timeFrom}&time_to=${timeTo}`
  );
  return data.items;
}
