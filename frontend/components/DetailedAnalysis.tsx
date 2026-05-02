"use client";

import { motion } from "framer-motion";
import { Brain, Mic2, MessageSquare, Shield, Cpu, Zap } from "lucide-react";
import type { TrustState } from "@/lib/types";

type Props = {
  state: TrustState;
};

function pctColor(v: number): string {
  if (v > 0.7) return "text-trust-danger";
  if (v > 0.4) return "text-trust-warn";
  return "text-trust-safe";
}

function pctBg(v: number): string {
  if (v > 0.7) return "var(--trust-danger)";
  if (v > 0.4) return "var(--trust-warn)";
  return "var(--trust-safe)";
}

export function DetailedAnalysis({ state }: Props) {
  const spoof = state.detectors.antispoof;
  const scam = state.detectors.scam_pattern;
  const voice = state.detectors.voice_match;
  const source = state.analysis_source ?? "local";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
    >
      {/* Analysis source badge */}
      <div className="flex items-center gap-2">
        {source === "gemini" ? (
          <div className="flex items-center gap-1.5 rounded-md bg-aural-accent/15 px-2.5 py-1">
            <Brain className="h-3 w-3 text-aural-accent" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-aural-accent">
              Gemini 2.5 Analysis
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1">
            <Cpu className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Local Model Analysis
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1">
          <Zap className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {source === "gemini" ? "3 models + Gemini" : "3 local models"}
          </span>
        </div>
      </div>

      {/* Voice Authenticity */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Mic2 className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Voice Authenticity
          </p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className={`font-[family-name:var(--font-mono)] text-2xl font-bold ${pctColor(spoof.spoof_prob)}`}>
                {Math.round(spoof.spoof_prob * 100)}%
              </span>
              <span className="text-sm text-muted-foreground">synthetic probability</span>
            </div>
            {state.voice_reasoning && (
              <p className="mt-2 text-sm italic text-foreground-secondary">
                &quot;{state.voice_reasoning}&quot;
              </p>
            )}
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.round(spoof.spoof_prob * 100)}%`, background: pctBg(spoof.spoof_prob) }}
          />
        </div>
      </div>

      {/* Scam Pattern Breakdown */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Scam Pattern Analysis
          </p>
        </div>
        {state.scam_reasoning && (
          <p className="mb-3 text-sm italic text-foreground-secondary">
            &quot;{state.scam_reasoning}&quot;
          </p>
        )}
        <div className="flex flex-col gap-2.5">
          {[
            { label: "Urgency", value: scam.urgency, desc: "Pressure to act immediately" },
            { label: "Financial Request", value: scam.financial_request, desc: "Demands for money or payment" },
            { label: "Impersonation", value: scam.impersonation, desc: "Claiming to be someone else" },
            { label: "Secrecy Pressure", value: scam.secrecy_pressure, desc: "\"Don't tell anyone\"" },
            { label: "Authority Threat", value: scam.authority_threat, desc: "Legal, police, or arrest threats" },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-foreground">{item.label}</span>
                  <span className="ml-2 text-[10px] text-muted-foreground">{item.desc}</span>
                </div>
                <span className={`font-[family-name:var(--font-mono)] text-sm font-semibold ${pctColor(item.value)}`}>
                  {Math.round(item.value * 100)}%
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(item.value * 100)}%`, background: pctBg(item.value) }}
                />
              </div>
            </div>
          ))}
        </div>
        {scam.trigger_phrases.length > 0 && (
          <div className="mt-3 border-t border-border pt-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Trigger Phrases Detected
            </p>
            <div className="flex flex-wrap gap-1.5">
              {scam.trigger_phrases.map((phrase) => (
                <span
                  key={phrase}
                  className="rounded bg-trust-danger/15 px-2 py-0.5 text-xs font-medium text-trust-danger"
                >
                  {phrase}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Speaker Verification */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Speaker Verification
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3 sm:gap-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Vault Match</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {voice.best_match_contact ?? "None"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Similarity</p>
            <p className={`mt-1 font-[family-name:var(--font-mono)] text-sm font-semibold ${
              voice.similarity > 0.6 ? "text-trust-safe" : voice.similarity > 0.3 ? "text-trust-warn" : "text-muted-foreground"
            }`}>
              {voice.similarity >= 0 ? `${Math.round(voice.similarity * 100)}%` : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Claims to be</p>
            <p className={`mt-1 text-sm font-semibold ${voice.claimed_identity ? "text-trust-warn" : "text-muted-foreground"}`}>
              {voice.claimed_identity ?? "No claim"}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
