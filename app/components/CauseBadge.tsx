import type { CauseOfDeath } from "@/packages/classifier";

const config: Record<
  CauseOfDeath,
  { label: string; emoji: string; className: string }
> = {
  RUG_PULL: {
    label: "Rug Pull",
    emoji: "💀",
    className: "bg-red-900/60 text-red-300 border border-red-700/50",
  },
  ABANDONED: {
    label: "Abandoned",
    emoji: "👻",
    className: "bg-purple-900/60 text-purple-300 border border-purple-700/50",
  },
  WHALE_EXIT: {
    label: "Whale Exit",
    emoji: "🐋",
    className: "bg-blue-900/60 text-blue-300 border border-blue-700/50",
  },
  NATURAL_DEATH: {
    label: "Natural Death",
    emoji: "⚰️",
    className: "bg-zinc-800/60 text-zinc-400 border border-zinc-600/50",
  },
};

export function CauseBadge({
  cause,
  size = "sm",
}: {
  cause: CauseOfDeath;
  size?: "sm" | "lg";
}) {
  const c = config[cause];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium ${c.className} ${size === "lg" ? "text-sm" : "text-xs"}`}
    >
      <span>{c.emoji}</span>
      <span>{c.label}</span>
    </span>
  );
}
