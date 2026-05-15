export function DeathScoreMeter({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  const color =
    clamped >= 80
      ? "#ff2222"
      : clamped >= 60
        ? "#ff8800"
        : clamped >= 40
          ? "#ffcc00"
          : "#39ff14";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-zinc-500">
        <span>Death Score</span>
        <span style={{ color }} className="font-mono font-bold">
          {clamped}/100
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all glow-bar"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
