"use client";

import { motion } from "framer-motion";

type Props = {
  title: string;
  subtitle?: string;
  value01: number;
  invert?: boolean;
};

function status(v: number, invert?: boolean) {
  const t = invert ? 1 - v : v;
  if (t < 0.35) return { label: "Clear", cls: "bg-trust-safe/15 text-trust-safe" };
  if (t < 0.65) return { label: "Watch", cls: "bg-trust-warn/15 text-trust-warn" };
  return { label: "Alert", cls: "bg-trust-danger/15 text-trust-danger" };
}

function barColor(v: number, invert?: boolean): string {
  const t = invert ? 1 - v : v;
  if (t < 0.35) return "var(--trust-safe)";
  if (t < 0.65) return "var(--trust-warn)";
  return "var(--trust-danger)";
}

export function DetectorMeter({ title, subtitle, value01, invert }: Props) {
  const pct = Math.round(Math.max(0, Math.min(1, value01)) * 100);
  const s = status(value01, invert);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s.cls}`}>
          {s.label}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-border">
        <motion.div
          className="h-full rounded-full"
          style={{ background: barColor(value01, invert) }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
      <p className="text-right font-[family-name:var(--font-mono)] text-xs tabular-nums text-muted-foreground">
        {pct}%
      </p>
    </div>
  );
}
