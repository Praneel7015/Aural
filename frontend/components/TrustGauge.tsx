"use client";

import { motion } from "framer-motion";
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

function gaugeColor(score: number): string {
  if (score >= 70) return "var(--trust-safe)";
  if (score >= 40) return "var(--trust-warn)";
  return "var(--trust-danger)";
}

export function TrustGauge({ score }: { score: number }) {
  const v = Math.max(0, Math.min(100, score));
  const fill = gaugeColor(v);
  const data = [{ name: "trust", value: v, fill }];

  return (
    <motion.div
      className="relative mx-auto flex size-[min(92vw,380px)] flex-col items-center justify-center"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="76%"
          outerRadius="100%"
          barSize={22}
          data={data}
          startAngle={220}
          endAngle={-40}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar background={{ fill: "rgba(128,128,128,0.15)" }} dataKey="value" cornerRadius={12} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 pt-6">
        <span className="font-display text-6xl font-bold tabular-nums tracking-tight text-black dark:text-white">
          {v}
        </span>
        <span className="text-xs font-bold uppercase tracking-[0.35em] text-black/60 dark:text-white/60">Trust</span>
      </div>
    </motion.div>
  );
}
