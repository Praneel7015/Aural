"use client";

import { motion } from "framer-motion";
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

function gaugeColor(score: number): string {
  if (score >= 70) return "var(--trust-safe)";
  if (score >= 40) return "var(--trust-warn)";
  return "var(--trust-danger)";
}

function label(score: number): string {
  if (score >= 70) return "Safe";
  if (score >= 40) return "Caution";
  return "Threat";
}

export function TrustGauge({ score }: { score: number }) {
  const v = Math.max(0, Math.min(100, score));
  const fill = gaugeColor(v);
  const data = [{ name: "trust", value: v, fill }];

  return (
    <motion.div
      className="relative mx-auto flex aspect-square w-full max-w-[240px] flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="78%"
          outerRadius="100%"
          barSize={14}
          data={data}
          startAngle={220}
          endAngle={-40}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            background={{ fill: "var(--border)" }}
            dataKey="value"
            cornerRadius={8}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-4">
        <span
          className="font-[family-name:var(--font-mono)] text-5xl font-bold tabular-nums tracking-tight"
          style={{ color: fill }}
        >
          {v}
        </span>
        <span className="mt-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {label(v)}
        </span>
      </div>
    </motion.div>
  );
}
