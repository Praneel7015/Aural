"use client";

import { Download } from "lucide-react";
import type { TrustState } from "@/lib/types";

type Props = {
  state: TrustState;
};

function generateReport(state: TrustState): string {
  const d = new Date(state.timestamp * 1000);
  const dateStr = d.toLocaleString();
  const spoof = state.detectors.antispoof;
  const scam = state.detectors.scam_pattern;
  const voice = state.detectors.voice_match;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Verity Forensic Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 720px; margin: 0 auto; padding: 40px 24px; color: #0f172a; background: #fff; }
  h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
  .subtitle { color: #64748b; font-size: 13px; margin-bottom: 32px; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
  .verdict { display: inline-block; padding: 6px 16px; border-radius: 6px; font-weight: 700; font-size: 18px; text-transform: uppercase; }
  .verdict-scam { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
  .verdict-suspicious { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
  .verdict-trusted { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
  .score { font-size: 48px; font-weight: 800; font-variant-numeric: tabular-nums; }
  .score-scam { color: #dc2626; }
  .score-suspicious { color: #b45309; }
  .score-trusted { color: #16a34a; }
  .meter { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
  .meter-label { color: #475569; font-size: 14px; }
  .meter-value { font-weight: 600; font-variant-numeric: tabular-nums; font-size: 14px; }
  .reasons li { color: #475569; font-size: 14px; padding: 4px 0; }
  .reasons li::before { content: "-- "; color: #dc2626; font-weight: 600; }
  .transcript { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.7; color: #334155; white-space: pre-wrap; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 11px; text-align: center; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
  .card-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 8px; }
</style>
</head>
<body>
  <h1>Verity Forensic Report</h1>
  <p class="subtitle">Generated ${dateStr}</p>

  <div class="section">
    <div class="section-title">Verdict</div>
    <div style="display:flex;align-items:center;gap:20px;">
      <span class="score score-${state.verdict}">${state.trust_score}</span>
      <span class="verdict verdict-${state.verdict}">${state.verdict}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Detector Scores</div>
    <div class="grid">
      <div class="card">
        <div class="card-title">Synthetic Voice (Anti-Spoof)</div>
        <div class="meter"><span class="meter-label">Spoof probability</span><span class="meter-value">${(spoof.spoof_prob * 100).toFixed(1)}%</span></div>
        <div class="meter"><span class="meter-label">Confidence</span><span class="meter-value">${(spoof.confidence * 100).toFixed(1)}%</span></div>
      </div>
      <div class="card">
        <div class="card-title">Voice Match</div>
        <div class="meter"><span class="meter-label">Best match</span><span class="meter-value">${voice.best_match_contact ?? "None"}</span></div>
        <div class="meter"><span class="meter-label">Similarity</span><span class="meter-value">${voice.similarity >= 0 ? (voice.similarity * 100).toFixed(1) + "%" : "N/A"}</span></div>
        <div class="meter"><span class="meter-label">Claimed identity</span><span class="meter-value">${voice.claimed_identity ?? "None"}</span></div>
      </div>
    </div>
    <div class="card" style="margin-top:16px;">
      <div class="card-title">Scam Pattern Analysis</div>
      <div class="meter"><span class="meter-label">Urgency</span><span class="meter-value">${(scam.urgency * 100).toFixed(0)}%</span></div>
      <div class="meter"><span class="meter-label">Financial request</span><span class="meter-value">${(scam.financial_request * 100).toFixed(0)}%</span></div>
      <div class="meter"><span class="meter-label">Impersonation</span><span class="meter-value">${(scam.impersonation * 100).toFixed(0)}%</span></div>
      <div class="meter"><span class="meter-label">Secrecy pressure</span><span class="meter-value">${(scam.secrecy_pressure * 100).toFixed(0)}%</span></div>
      <div class="meter"><span class="meter-label">Authority threat</span><span class="meter-value">${(scam.authority_threat * 100).toFixed(0)}%</span></div>
      ${scam.trigger_phrases.length > 0 ? `<div class="meter"><span class="meter-label">Trigger phrases</span><span class="meter-value">${scam.trigger_phrases.join(", ")}</span></div>` : ""}
    </div>
  </div>

  ${state.reasons.length > 0 ? `
  <div class="section">
    <div class="section-title">Red Flags</div>
    <ul class="reasons">${state.reasons.map((r) => `<li>${r}</li>`).join("")}</ul>
  </div>` : ""}

  ${state.challenge_suggestion ? `
  <div class="section">
    <div class="section-title">Challenge Suggestion</div>
    <p style="color:#b45309;font-size:14px;">${state.challenge_suggestion}</p>
  </div>` : ""}

  <div class="section">
    <div class="section-title">Transcript</div>
    <div class="transcript">${state.transcript_partial || "(no transcript captured)"}</div>
  </div>

  <div class="footer">
    Verity -- Real-time AI scam-call shield. This report was generated automatically.<br>
    Report ID: ${Date.now().toString(36).toUpperCase()} | Timestamp: ${d.toISOString()}
  </div>
</body>
</html>`;
}

function downloadHtml(state: TrustState) {
  const html = generateReport(state);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `verity-report-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJson(state: TrustState) {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `verity-data-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ForensicExport({ state }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Forensic Export
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => downloadHtml(state)}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Download className="h-3.5 w-3.5" />
          HTML Report
        </button>
        <button
          type="button"
          onClick={() => downloadJson(state)}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Download className="h-3.5 w-3.5" />
          JSON Data
        </button>
      </div>
    </div>
  );
}
