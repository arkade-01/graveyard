# ⚰️ GRAVEYARD

> *Where Solana tokens go to die.*

GRAVEYARD is a real-time museum of dead Solana tokens — every tombstone is a token that rugged, got abandoned, got whale-dumped, or just quietly faded into nothing. It pulls live data from the Birdeye API, runs each token through a death classifier, assigns a cause of death and a 0–100 Death Score, and renders the whole thing as a dark gothic graveyard with individual autopsy pages. It's part data tool, part memorial, part dark comedy.

**[graveyard-six.vercel.app](https://graveyard-six.vercel.app/)**

---

## Screenshot

![GRAVEYARD screenshot](./public/screenshot.png)

*(Replace with an actual screenshot)*

---

## How Death Classification Works

### Causes of Death

A token qualifies as **dead** if any of these conditions are true:
- 24h volume < $1,000
- Liquidity < $5,000
- Price down 90%+ from its all-time high (via OHLCV history)
- Holder count < 50

Once flagged as dead, the classifier assigns one of four causes:

| Cause | Badge | Condition |
|---|---|---|
| **Rug Pull** 💀 | Red | Liquidity dropped 80%+ *and* top 5 holders control >70% of supply |
| **Whale Exit** 🐋 | Blue | Buy/sell ratio < 0.2 — sells dominate, big money left first |
| **Abandoned** 👻 | Purple | Volume < $500 and holder count < 100 — the dev just stopped |
| **Natural Death** ⚰️ | Gray | Everything else — it tried, it faded, nobody noticed |

Each cause comes with a dynamically generated epitaph interpolated from the token's symbol.

### Death Score (0–100)

The Death Score measures *how dead* a token is across four dimensions:

| Factor | Max Points | Tiers |
|---|---|---|
| **Volume collapse** | 30 pts | < $100 → 30 · < $500 → 20 · < $1K → 10 |
| **Liquidity drain** | 30 pts | < $1K → 30 · < $2K → 20 · < $5K → 10 |
| **Price collapse** | 25 pts | > 99% lost → 25 · > 95% → 15 · > 90% → 10 |
| **Holder exodus** | 15 pts | < 10 holders → 15 · < 25 → 10 · < 50 → 5 |

A score of 100 means the token is maximally dead on every axis. Scores glow green below 40, orange past 60, and red past 80 — like a monitor showing a flatline.

---

## Birdeye Endpoints

All API calls are server-side only. `BIRDEYE_API_KEY` never touches the client.

| Endpoint | Used for |
|---|---|
| `GET /defi/token_trending?sort_by=rank&sort_type=asc&interval=24h&limit=20` | Pulls trending tokens sorted by lowest rank, then filters for candidates with low volume or liquidity |
| `GET /defi/token_overview?address={}` | Core vitals per token: price, volume, liquidity, holder count, 24h change, market cap |
| `GET /defi/v3/token/holder?address={}&limit=20` | Top holder concentration — used to detect rug pulls |
| `GET /defi/v3/token/txs?address={}&limit=50` | Recent buy/sell ratio — used to detect whale exits |
| `GET /defi/ohlcv?address={}&type=1H&time_from={}&time_to={}` | 30-day price and volume history — used to find peak price, calculate % lost, and estimate time of death |

The graveyard list uses a hardcoded seed of 10 known dead tokens merged with any weak candidates from the trending feed. Results are cached server-side for 5 minutes via `unstable_cache`.

---

## Local Setup

**Prerequisites:** Node.js 18+, a [Birdeye API key](https://bds.birdeye.so/)

```bash
# 1. Clone and install
git clone https://github.com/your-username/graveyard
cd graveyard
npm install

# 2. Set your API key
cp .env.local.example .env.local
# then edit .env.local and add your key

# 3. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `BIRDEYE_API_KEY` | ✅ | Your Birdeye API key — server-side only, never exposed to the client |

Create `.env.local`:

```env
BIRDEYE_API_KEY=your_key_here
```

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, server components, `unstable_cache`) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Icons | Lucide React |
| API | Birdeye — all calls server-side in `app/api/` route handlers |
| Fonts | Geist (data) · MedievalSharp (gothic headers) |
| Hosting | Vercel |

### Project Structure

```
app/
  api/
    graveyard/route.ts          # GET /api/graveyard — main dead token list
    token/[address]/autopsy/    # GET /api/token/:address/autopsy — single token
  lib/
    graveyard.ts                # Data fetching + unstable_cache (5 min TTL)
    autopsy.ts                  # Per-token autopsy data fetch
  components/                   # TombstoneCard, CauseBadge, charts, etc.
  token/[address]/page.tsx      # Autopsy page — streams via <Suspense>
  page.tsx                      # Main graveyard grid/table
packages/
  birdeye/index.ts              # Typed Birdeye API wrapper
  classifier/index.ts           # Pure death classification functions
```

---

## API

The data routes are public if you want to build on top of them:

```
GET /api/graveyard
→ Returns top 20 dead tokens sorted by Death Score, cached 5 min

GET /api/token/:address/autopsy
→ Returns full death breakdown for any Solana token address
```

---

*No tokens were harmed in the making of this site. They were already dead.*
