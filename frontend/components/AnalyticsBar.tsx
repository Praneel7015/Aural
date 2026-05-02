"use client";

import { useEffect, useState } from "react";
import { Shield, ShieldAlert, ShieldCheck, Activity } from "lucide-react";
import { loadHistory, getStats } from "@/lib/call-history";

type Props = {
  refreshKey: number;
};

export function AnalyticsBar({ refreshKey }: Props) {
  const [stats, setStats] = useState({ total: 0, scams: 0, suspicious: 0, safe: 0, avgScore: 100 });

  useEffect(() => {
    setStats(getStats(loadHistory()));
  }, [refreshKey]);

  if (stats.total === 0) return null;

  const items = [
    {
      label: "Analyzed",
      value: stats.total,
      Icon: Activity,
      cls: "text-foreground",
    },
    {
      label: "Threats Blocked",
      value: stats.scams,
      Icon: ShieldAlert,
      cls: "text-trust-danger",
    },
    {
      label: "Warnings",
      value: stats.suspicious,
      Icon: Shield,
      cls: "text-trust-warn",
    },
    {
      label: "Safe Calls",
      value: stats.safe,
      Icon: ShieldCheck,
      cls: "text-trust-safe",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => {
        const { Icon } = item;
        return (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
          >
            <Icon className={`h-4 w-4 shrink-0 ${item.cls}`} />
            <div>
              <p className={`font-[family-name:var(--font-mono)] text-lg font-bold tabular-nums ${item.cls}`}>
                {item.value}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {item.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
