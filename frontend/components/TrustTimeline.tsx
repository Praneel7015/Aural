"use client";

import { useVerityStore, type ScorePoint } from "@/lib/store";

function getColor(score: number): string {
  if (score >= 70) return "var(--trust-safe)";
  if (score >= 40) return "var(--trust-warn)";
  return "var(--trust-danger)";
}

export function TrustTimeline() {
  const history = useVerityStore((s) => s.scoreHistory);

  if (history.length < 2) return null;

  const maxPoints = 20;
  const points: ScorePoint[] = history.slice(-maxPoints);
  const w = 100;
  const h = 40;
  const padX = 2;
  const padY = 4;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  const pathParts = points.map((p, i) => {
    const x = padX + (i / (points.length - 1)) * innerW;
    const y = padY + ((100 - p.score) / 100) * innerH;
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  });

  const lastScore = points[points.length - 1].score;
  const lastColor = getColor(lastScore);

  // Fill area under curve
  const firstX = padX;
  const lastX = padX + ((points.length - 1) / (points.length - 1)) * innerW;
  const fillPath = pathParts.join(" ") + ` L ${lastX.toFixed(1)} ${h} L ${firstX.toFixed(1)} ${h} Z`;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Trust Score Timeline
        </p>
        <span
          className="font-[family-name:var(--font-mono)] text-xs font-semibold"
          style={{ color: lastColor }}
        >
          {lastScore}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        preserveAspectRatio="none"
        style={{ height: 60 }}
      >
        {/* Threshold lines */}
        <line
          x1={padX}
          y1={padY + ((100 - 70) / 100) * innerH}
          x2={w - padX}
          y2={padY + ((100 - 70) / 100) * innerH}
          stroke="var(--trust-safe)"
          strokeWidth="0.3"
          strokeDasharray="2 2"
          opacity="0.4"
        />
        <line
          x1={padX}
          y1={padY + ((100 - 40) / 100) * innerH}
          x2={w - padX}
          y2={padY + ((100 - 40) / 100) * innerH}
          stroke="var(--trust-danger)"
          strokeWidth="0.3"
          strokeDasharray="2 2"
          opacity="0.4"
        />

        {/* Fill */}
        <path d={fillPath} fill={lastColor} opacity="0.08" />

        {/* Line */}
        <path
          d={pathParts.join(" ")}
          fill="none"
          stroke={lastColor}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Current point */}
        {points.length > 0 && (() => {
          const last = points.length - 1;
          const cx = padX + (last / (points.length - 1)) * innerW;
          const cy = padY + ((100 - points[last].score) / 100) * innerH;
          return (
            <>
              <circle cx={cx} cy={cy} r="2" fill={lastColor} opacity="0.3" />
              <circle cx={cx} cy={cy} r="1" fill={lastColor} />
            </>
          );
        })()}
      </svg>
      <div className="mt-1 flex justify-between text-[9px] text-muted-foreground">
        <span>Start</span>
        <span>Now</span>
      </div>
    </div>
  );
}
