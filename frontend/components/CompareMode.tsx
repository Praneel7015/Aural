"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, ArrowRight, ShieldCheck, ShieldX, Loader2 } from "lucide-react";
import type { TrustState, TrustVerdict } from "@/lib/types";
import { apiBase } from "@/lib/ws";

type CompareResult = {
  name: string;
  state: TrustState;
};

function verdictBadge(v: TrustVerdict) {
  if (v === "trusted") return { cls: "bg-trust-safe/15 text-trust-safe border-trust-safe/30", label: "SAFE" };
  if (v === "suspicious") return { cls: "bg-trust-warn/15 text-trust-warn border-trust-warn/30", label: "WARNING" };
  return { cls: "bg-trust-danger/15 text-trust-danger border-trust-danger/30", label: "SCAM" };
}

function scoreColor(s: number) {
  if (s >= 70) return "text-trust-safe";
  if (s >= 40) return "text-trust-warn";
  return "text-trust-danger";
}

function ResultCard({ result }: { result: CompareResult }) {
  const { state } = result;
  const v = verdictBadge(state.verdict as TrustVerdict);
  const spoof = state.detectors.antispoof.spoof_prob;
  const scam = state.detectors.scam_pattern;
  const scamMax = Math.max(scam.urgency, scam.financial_request, scam.impersonation, scam.secrecy_pressure, scam.authority_threat);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="truncate text-sm font-medium text-foreground">{result.name}</p>
        <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${v.cls}`}>
          {v.label}
        </span>
      </div>

      <div className="text-center">
        <span className={`font-[family-name:var(--font-mono)] text-4xl font-bold ${scoreColor(state.trust_score)}`}>
          {state.trust_score}
        </span>
        <p className="text-[10px] text-muted-foreground">Trust Score</p>
      </div>

      <div className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Synthetic Voice</span>
          <span className={`font-[family-name:var(--font-mono)] font-medium ${spoof > 0.5 ? "text-trust-danger" : "text-trust-safe"}`}>
            {Math.round(spoof * 100)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Scam Signals</span>
          <span className={`font-[family-name:var(--font-mono)] font-medium ${scamMax > 0.5 ? "text-trust-danger" : "text-trust-safe"}`}>
            {Math.round(scamMax * 100)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Voice Match</span>
          <span className="font-[family-name:var(--font-mono)] font-medium text-foreground-secondary">
            {state.detectors.voice_match.best_match_contact ?? "None"}
          </span>
        </div>
      </div>

      {state.transcript_partial && (
        <div className="border-t border-border pt-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Transcript</p>
          <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-foreground-secondary">
            {state.transcript_partial}
          </p>
        </div>
      )}

      {state.reasons.length > 0 && (
        <div className="border-t border-border pt-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-trust-danger">Flags</p>
          {state.reasons.map((r) => (
            <p key={r} className="text-xs text-foreground-secondary">
              <span className="text-trust-danger">-- </span>{r}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function CompareMode() {
  const [results, setResults] = useState<CompareResult[]>([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setLoading(true);

    const newResults: CompareResult[] = [];
    for (const file of Array.from(files).slice(0, 4)) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch(`${apiBase()}/upload`, { method: "POST", body: fd });
        const data = (await r.json()) as TrustState;
        newResults.push({ name: file.name, state: data });
      } catch {
        // skip failed files
      }
    }

    setResults(newResults);
    setLoading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-2.5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Compare Audio Files
        </p>
      </div>
      <div className="p-4">
        <p className="mb-3 text-sm text-muted-foreground">
          Upload 2-4 audio files to compare their analysis side by side.
        </p>
        <button
          type="button"
          disabled={loading}
          onClick={() => fileRef.current?.click()}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing files...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Select 2-4 audio files
            </>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="audio/*,.wav,.mp3,.m4a,.ogg"
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />

        {results.length >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2"
          >
            {results.map((r, i) => (
              <ResultCard key={`${r.name}-${i}`} result={r} />
            ))}
          </motion.div>
        )}

        {results.length === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
            <ResultCard result={results[0]} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
