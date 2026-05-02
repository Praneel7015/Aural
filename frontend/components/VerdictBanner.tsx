"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle, ShieldX } from "lucide-react";
import type { TrustVerdict } from "@/lib/types";

const config: Record<TrustVerdict, {
  title: string;
  subtitle: string;
  cls: string;
  borderCls: string;
  Icon: typeof CheckCircle;
}> = {
  trusted: {
    title: "Trusted",
    subtitle: "No scam signals detected in this window.",
    cls: "text-trust-safe bg-trust-safe/10",
    borderCls: "border-l-trust-safe",
    Icon: CheckCircle,
  },
  suspicious: {
    title: "Suspicious -- Verify Before Acting",
    subtitle: "Caller shows warning signs. Verify their identity before sharing information or sending money.",
    cls: "text-trust-warn bg-trust-warn/10",
    borderCls: "border-l-trust-warn",
    Icon: AlertTriangle,
  },
  scam: {
    title: "SCAM DETECTED -- DO NOT SEND MONEY",
    subtitle: "This call matches known scam patterns. Hang up immediately and call back through an official number.",
    cls: "text-trust-danger bg-trust-danger/12",
    borderCls: "border-l-trust-danger",
    Icon: ShieldX,
  },
};

export function VerdictBanner({ verdict }: { verdict: TrustVerdict }) {
  const c = config[verdict];
  const { Icon } = c;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={verdict}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.2 }}
        className={`flex items-start gap-3 rounded-lg border-l-[3px] px-4 py-3.5 ${c.cls} ${c.borderCls} ${
          verdict === "scam" ? "animate-pulse" : ""
        }`}
      >
        <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div>
          <p className={`font-semibold ${verdict === "scam" ? "text-base" : "text-sm"}`}>{c.title}</p>
          <p className="mt-0.5 text-sm text-foreground-secondary">{c.subtitle}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
