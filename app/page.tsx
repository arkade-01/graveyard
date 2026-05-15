import { Suspense } from "react";
import { GraveyardClient } from "./components/GraveyardClient";
import { TombstoneSkeleton } from "./components/TombstoneSkeleton";
import type { GraveyardResponse } from "./api/graveyard/route";

async function getGraveyardData(): Promise<GraveyardResponse> {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ??
    `http://localhost:${process.env.PORT ?? 3000}`;
  const res = await fetch(`${base}/api/graveyard`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load graveyard");
  return res.json() as Promise<GraveyardResponse>;
}

function GraveyardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <TombstoneSkeleton key={i} />
      ))}
    </div>
  );
}

async function GraveyardContent() {
  const data = await getGraveyardData();
  return <GraveyardClient data={data} />;
}

export default function HomePage() {
  return (
    <main className="min-h-screen px-4 py-12 max-w-7xl mx-auto space-y-10">
      {/* Hero */}
      <header className="text-center space-y-4">
        <h1 className="font-gothic text-6xl sm:text-8xl text-white tracking-wider drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
          ⚰️ GRAVEYARD
        </h1>
        <p className="text-zinc-500 tracking-widest uppercase text-sm">
          Where Solana tokens go to die.
        </p>
        <div className="flex justify-center">
          <div className="h-px w-48 bg-linear-to-r from-transparent via-zinc-700 to-transparent" />
        </div>
      </header>

      {/* Content */}
      <Suspense fallback={<GraveyardSkeleton />}>
        <GraveyardContent />
      </Suspense>

      {/* Footer */}
      <footer className="text-center text-zinc-700 text-xs pb-20 space-y-1">
        <p>Powered by Birdeye API · Data refreshes every 5 minutes</p>
        <p>No tokens were harmed in the making of this site. They were already dead.</p>
      </footer>
    </main>
  );
}
