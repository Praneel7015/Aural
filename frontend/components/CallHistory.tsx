"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Trash2, ChevronDown, ChevronUp, ShieldCheck, AlertTriangle, ShieldX } from "lucide-react";
import { loadHistory, clearHistory, type CallRecord } from "@/lib/call-history";
import type { TrustVerdict } from "@/lib/types";

const verdictConfig: Record<TrustVerdict, { Icon: typeof ShieldCheck; cls: string; label: string }> = {
  trusted: { Icon: ShieldCheck, cls: "text-trust-safe", label: "Safe" },
  suspicious: { Icon: AlertTriangle, cls: "text-trust-warn", label: "Warning" },
  scam: { Icon: ShieldX, cls: "text-trust-danger", label: "Scam" },
};

type Props = {
  refreshKey: number;
  onSelect?: (record: CallRecord) => void;
};

export function CallHistory({ refreshKey, onSelect }: Props) {
  const [history, setHistory] = useState<CallRecord[]>([]);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    setHistory(loadHistory());
  }, [refreshKey]);

  function handleClear() {
    clearHistory();
    setHistory([]);
  }

  if (!history.length) return null;

  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between border-b border-border px-4 py-2.5"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Call History ({history.length})
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="max-h-[300px] overflow-y-auto">
              {history.slice(0, 20).map((record) => {
                const vc = verdictConfig[record.verdict];
                const { Icon } = vc;
                const d = new Date(record.timestamp);
                const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                const dateStr = d.toLocaleDateString([], { month: "short", day: "numeric" });
                return (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => onSelect?.(record)}
                    className="flex w-full cursor-pointer items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/50"
                  >
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${vc.cls}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-semibold ${vc.cls}`}>
                          {vc.label}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {dateStr} {timeStr}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {record.transcriptSnippet}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-[family-name:var(--font-mono)] text-[10px] font-medium text-foreground-secondary">
                          Score: {record.trustScore}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {record.source === "demo" ? "Demo" : record.source === "mic" ? "Mic" : "Upload"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="border-t border-border px-4 py-2">
              <button
                type="button"
                onClick={handleClear}
                className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-trust-danger"
              >
                <Trash2 className="h-3 w-3" />
                Clear history
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
