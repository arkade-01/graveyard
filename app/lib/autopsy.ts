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
  const [overview, holders, txs, ohlcv] = await Promise.all([
    getTokenOverview(address),
    getTopHolders(address),
    getRecentTxs(address),
    getOHLCV(address, ago30d(), nowTs()),
  ]);

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
