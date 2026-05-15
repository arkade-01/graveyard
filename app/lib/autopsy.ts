import {
  getTokenOverview,
  getTopHolders,
  getRecentTxs,
  getOHLCV,
} from "@/packages/birdeye";
import { classifyDeath } from "@/packages/classifier";
import type { DeathResult } from "@/packages/classifier";
import type { TokenOverview, HolderItem, TxItem, OHLCVItem } from "@/packages/birdeye";

export interface AutopsyResponse {
  address: string;
  symbol: string;
  name: string;
  logoURI: string | null;
  overview: TokenOverview;
  holders: HolderItem[];
  txs: TxItem[];
  ohlcv: OHLCVItem[];
  death: DeathResult;
}

const nowTs = () => Math.floor(Date.now() / 1000);
const ago30d = () => nowTs() - 30 * 24 * 60 * 60;

export async function getAutopsyData(address: string): Promise<AutopsyResponse> {
  // overview is required — if it fails we genuinely can't render anything.
  const overview = await getTokenOverview(address);

  // holders, txs, ohlcv are enrichment — degrade gracefully if they fail
  // (rate limits, missing data) rather than killing the whole page.
  const [holdersResult, txsResult, ohlcvResult] = await Promise.allSettled([
    getTopHolders(address),
    getRecentTxs(address),
    getOHLCV(address, ago30d(), nowTs()),
  ]);

  const holders: HolderItem[] =
    holdersResult.status === "fulfilled" ? holdersResult.value : [];
  const txs: TxItem[] =
    txsResult.status === "fulfilled" ? txsResult.value : [];
  const ohlcv: OHLCVItem[] =
    ohlcvResult.status === "fulfilled" ? ohlcvResult.value : [];

  const death = classifyDeath(overview, holders, txs, ohlcv);

  return {
    address,
    symbol: overview.symbol,
    name: overview.name,
    logoURI: overview.logoURI,
    overview,
    holders,
    txs,
    ohlcv,
    death,
  };
}
