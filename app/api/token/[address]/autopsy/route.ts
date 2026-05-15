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

const now30d = () => Math.floor(Date.now() / 1000);
const ago30d = () => now30d() - 30 * 24 * 60 * 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  try {
    const [overview, holders, txs, ohlcv] = await Promise.all([
      getTokenOverview(address),
      getTopHolders(address),
      getRecentTxs(address),
      getOHLCV(address, ago30d(), now30d()),
    ]);

    const death = classifyDeath(overview, holders, txs, ohlcv);

    const response: AutopsyResponse = {
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

    return Response.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
