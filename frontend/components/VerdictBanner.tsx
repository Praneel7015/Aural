"use client";

import { motion } from "framer-motion";

import type { TrustVerdict } from "@/lib/types";
import { cn } from "@/lib/utils";

const copy: Record<
  TrustVerdict,
  { title: string; subtitle: string; cls: string; pulse: boolean }
> = {
  trusted: {
    title: "Trusted",
    subtitle: "No strong scam signals in this window.",
    cls: "border-emerald-500/35 bg-emerald-500/10 text-emerald-900 dark:text-emerald-50",
    pulse: false,
  },
  suspicious: {
    title: "Suspicious — verify before acting",
    subtitle: "Pause and confirm identity out-of-band.",
    cls: "border-amber-400/40 bg-amber-500/10 text-amber-900 dark:text-amber-50",
    pulse: true,
  },
  scam: {
    title: "Scam detected — do not send money",
    subtitle: "Hang up. Contact the institution through an official number.",
    cls: "border-rose-500/45 bg-rose-600/10 text-rose-900 dark:text-rose-50",
    pulse: true,
  },
};

export function VerdictBanner({ verdict }: { verdict: TrustVerdict }) {
  const item = copy[verdict];
  return (
    <motion.div
      layout
      className={cn(
        "relative overflow-hidden rounded-lg border px-5 py-4",
        item.cls,
      )}
      animate={
        item.pulse
          ? { opacity: [1, 0.92, 1], scale: [1, 1.005, 1] }
          : { opacity: 1 }
      }
      transition={{ duration: verdict === "scam" ? 1.2 : 2.4, repeat: Infinity }}
    >
      <div className="relative flex flex-col gap-1">
        <p className="font-display text-xl font-bold tracking-tight md:text-2xl">
          {item.title}
        </p>
        <p className="text-sm opacity-90 font-body">{item.subtitle}</p>
      </div>
    </motion.div>
  );
}
