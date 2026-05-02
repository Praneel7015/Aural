"use client";

import Link from "next/link";
import { ArrowLeft, Globe, TrendingUp, AlertTriangle, ShieldX, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";

const THREAT_FEED = [
  {
    id: 1,
    type: "Grandparent Scam",
    severity: "critical",
    region: "South Asia",
    description: "Spike in AI-cloned voice calls impersonating family members, demanding urgent wire transfers. Voices cloned from WhatsApp voice notes.",
    detections: 12847,
    trend: "+340%",
    lastSeen: "2 hours ago",
  },
  {
    id: 2,
    type: "IRS / Tax Authority",
    severity: "high",
    region: "North America",
    description: "Automated calls claiming tax violations with arrest threats. Demanding gift card payments. Using TTS with regional accents.",
    detections: 8432,
    trend: "+120%",
    lastSeen: "45 min ago",
  },
  {
    id: 3,
    type: "Bank Fraud",
    severity: "high",
    region: "Global",
    description: 'Callers impersonating bank fraud departments. Asking victims to "move money to safe accounts" while they drain the real ones.',
    detections: 6291,
    trend: "+85%",
    lastSeen: "1 hour ago",
  },
  {
    id: 4,
    type: "Tech Support",
    severity: "medium",
    region: "Europe",
    description: "Fake Microsoft/Apple support calls claiming device compromise. Requesting remote access and payment for non-existent fixes.",
    detections: 3156,
    trend: "+45%",
    lastSeen: "3 hours ago",
  },
  {
    id: 5,
    type: "Kidnapping Extortion",
    severity: "critical",
    region: "Latin America",
    description: "AI-cloned voices of family members used in fake kidnapping calls. Demanding immediate ransom via crypto.",
    detections: 2891,
    trend: "+560%",
    lastSeen: "30 min ago",
  },
  {
    id: 6,
    type: "Investment Scam",
    severity: "medium",
    region: "Southeast Asia",
    description: 'Deepfake video calls impersonating financial advisors. Promising guaranteed returns with "act now" pressure.',
    detections: 1543,
    trend: "+65%",
    lastSeen: "5 hours ago",
  },
];

const STATS = [
  { label: "Active Threats", value: "23", icon: ShieldX, cls: "text-trust-danger" },
  { label: "Detections Today", value: "35.2K", icon: AlertTriangle, cls: "text-trust-warn" },
  { label: "Countries Affected", value: "47", icon: Globe, cls: "text-foreground" },
  { label: "Avg Response", value: "1.8s", icon: Clock, cls: "text-trust-safe" },
];

const sevConfig = {
  critical: { cls: "bg-trust-danger/10 text-trust-danger border-trust-danger/20", label: "Critical" },
  high: { cls: "bg-trust-warn/10 text-trust-warn border-trust-warn/20", label: "High" },
  medium: { cls: "bg-foreground/5 text-foreground-secondary border-border", label: "Medium" },
};

export default function ThreatsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-[family-name:var(--font-brand)] text-base font-semibold tracking-tight text-foreground">
              Verity
            </Link>
            <div className="h-4 w-px bg-border" />
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-3 w-3" />
              Dashboard
            </Link>
            <div className="h-4 w-px bg-border" />
            <span className="text-xs font-medium text-muted-foreground">Threat Intelligence</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Community Threat Feed</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time intelligence on active voice scam campaigns worldwide.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATS.map((s, i) => {
            const { icon: Icon } = s;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
              >
                <Icon className={`h-4 w-4 shrink-0 ${s.cls}`} />
                <div>
                  <p className={`font-[family-name:var(--font-mono)] text-lg font-bold tabular-nums ${s.cls}`}>
                    {s.value}
                  </p>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Threat list */}
        <div className="flex flex-col gap-3">
          {THREAT_FEED.map((threat, i) => {
            const sev = sevConfig[threat.severity as keyof typeof sevConfig];
            return (
              <motion.div
                key={threat.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                className="rounded-lg border border-border bg-card p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-foreground">{threat.type}</h3>
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${sev.cls}`}>
                      {sev.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {threat.region}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {threat.lastSeen}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
                  {threat.description}
                </p>
                <div className="mt-3 flex items-center gap-6 text-xs">
                  <span className="text-muted-foreground">
                    <span className="font-[family-name:var(--font-mono)] font-medium text-foreground">{threat.detections.toLocaleString()}</span> detections
                  </span>
                  <span className="flex items-center gap-1 text-trust-danger">
                    <TrendingUp className="h-3 w-3" />
                    {threat.trend} this week
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 rounded-lg border border-dashed border-border px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Threat data is aggregated from anonymized Verity detections across the community.
            No personal audio or call data is shared.
          </p>
        </div>
      </main>
    </div>
  );
}
