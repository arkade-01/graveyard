"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import type { OHLCVItem } from "@/packages/birdeye";

function fmtTs(unix: number) {
  return new Date(unix * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function PriceChart({ ohlcv }: { ohlcv: OHLCVItem[] }) {
  if (ohlcv.length === 0)
    return (
      <p className="text-zinc-600 text-sm text-center py-8">No OHLCV data</p>
    );

  const data = ohlcv.map((c) => ({ time: fmtTs(c.unixTime), price: c.c }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <XAxis
          dataKey="time"
          tick={{ fill: "#52525b", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "#52525b", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          width={60}
          tickFormatter={(v: number) =>
            v < 0.0001 ? v.toExponential(1) : `$${v.toFixed(4)}`
          }
        />
        <Tooltip
          contentStyle={{
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: "8px",
            color: "#e8e8e8",
            fontSize: "12px",
          }}
          formatter={(v) => [`$${v}`, "Price"]}
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#ef4444"
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function VolumeChart({ ohlcv }: { ohlcv: OHLCVItem[] }) {
  if (ohlcv.length === 0) return null;

  const data = ohlcv.map((c) => ({ time: fmtTs(c.unixTime), volume: c.v }));
  const maxVol = Math.max(...data.map((d) => d.volume));

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data}>
        <XAxis
          dataKey="time"
          tick={{ fill: "#52525b", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: "8px",
            color: "#e8e8e8",
            fontSize: "12px",
          }}
          formatter={(v) => [typeof v === "number" ? `$${v.toFixed(0)}` : String(v), "Volume"]}
        />
        <Bar dataKey="volume" radius={[2, 2, 0, 0]}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={d.volume < maxVol * 0.1 ? "#3f3f46" : "#6366f1"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface ScoreFactor {
  label: string;
  value: number;
  max: number;
}

export function DeathScoreBreakdown({ factors }: { factors: ScoreFactor[] }) {
  return (
    <div className="space-y-3">
      {factors.map((f) => (
        <div key={f.label} className="space-y-1">
          <div className="flex justify-between text-xs text-zinc-500">
            <span>{f.label}</span>
            <span className="font-mono text-zinc-400">
              {f.value}/{f.max}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full glow-bar"
              style={{
                width: `${(f.value / f.max) * 100}%`,
                backgroundColor: f.value >= f.max * 0.7 ? "#ef4444" : "#39ff14",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
