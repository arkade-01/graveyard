"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";
import type { CauseOfDeath } from "@/packages/classifier";

const CAUSE_LABELS: Record<CauseOfDeath, string> = {
  RUG_PULL: "Rug Pull",
  ABANDONED: "Abandoned",
  WHALE_EXIT: "Whale Exit",
  NATURAL_DEATH: "Natural Death",
};

export function ShareButton({
  symbol,
  cause,
  percentLost,
}: {
  symbol: string;
  cause: CauseOfDeath;
  percentLost: number;
}) {
  const [copied, setCopied] = useState(false);

  const text = `Just found $${symbol} in the GRAVEYARD ⚰️\nCause: ${CAUSE_LABELS[cause]}. Lost ${percentLost.toFixed(1)}% from peak.\nRIP 🪦 #BirdeyeAPI`;

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: open Twitter
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
        "_blank"
      );
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
    >
      {copied ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />}
      {copied ? "Copied!" : "Share this autopsy"}
    </button>
  );
}
