import type { TrustState, TrustVerdict } from "@/lib/types";

export type CallRecord = {
  id: string;
  timestamp: number;
  verdict: TrustVerdict;
  trustScore: number;
  transcriptSnippet: string;
  reasons: string[];
  source: "mic" | "upload" | "demo";
  demoId?: string;
  /** Full TrustState for forensic export */
  fullState: TrustState;
};

const STORAGE_KEY = "verity-call-history";
const MAX_RECORDS = 50;

export function loadHistory(): CallRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CallRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveRecord(record: CallRecord): CallRecord[] {
  const history = loadHistory();
  const updated = [record, ...history].slice(0, MAX_RECORDS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function createRecord(
  state: TrustState,
  source: "mic" | "upload" | "demo",
  demoId?: string,
): CallRecord {
  const snippet = state.transcript_partial.length > 120
    ? state.transcript_partial.slice(0, 120) + "..."
    : state.transcript_partial;

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    verdict: state.verdict,
    trustScore: state.trust_score,
    transcriptSnippet: snippet || "(no transcript)",
    reasons: state.reasons,
    source,
    demoId,
    fullState: state,
  };
}

export function getStats(history: CallRecord[]) {
  const total = history.length;
  const scams = history.filter((r) => r.verdict === "scam").length;
  const suspicious = history.filter((r) => r.verdict === "suspicious").length;
  const safe = history.filter((r) => r.verdict === "trusted").length;
  const avgScore = total > 0
    ? Math.round(history.reduce((a, r) => a + r.trustScore, 0) / total)
    : 100;

  return { total, scams, suspicious, safe, avgScore };
}
