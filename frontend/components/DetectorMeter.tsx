"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type Props = {
  title: string;
  value01: number;
  invert?: boolean;
};

function badge(v: number, invert?: boolean) {
  const t = invert ? 1 - v : v;
  if (t < 0.35) return { label: "Clean", cls: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30" };
  if (t < 0.65) return { label: "Watch", cls: "bg-amber-500/15 text-amber-100 ring-amber-500/35" };
  return { label: "Alert", cls: "bg-rose-500/15 text-rose-100 ring-rose-500/35" };
}

export function DetectorMeter({ title, value01, invert }: Props) {
  const pct = Math.round(Math.max(0, Math.min(1, value01)) * 100);
  const b = badge(value01, invert);
  const pulse = pct > 65;

  return (
    <motion.div
      layout
      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md"
      animate={pulse ? { boxShadow: ["0 0 0 0 rgba(244,63,94,0)", "0 0 24px 2px rgba(244,63,94,0.25)", "0 0 0 0 rgba(244,63,94,0)"] } : {}}
      transition={{ duration: 1.6, repeat: pulse ? Infinity : 0 }}
    >
      <div className="flex flex-row items-start justify-between gap-3">
        <span className="font-medium text-[var(--foreground)]">{title}</span>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1", b.cls)}>
          {b.label}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/40">
        <motion.div
          className={cn("h-full rounded-full", invert ? "bg-[var(--trust-safe)]" : "bg-[var(--trust-danger)]")}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
        />
      </div>
      <div className="text-right text-xs tabular-nums text-[var(--muted)]">{pct}% signal</div>
    </motion.div>
  );
}
