"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, Mic, Shield, UploadCloud } from "lucide-react";

import { ChallengeQuestion } from "@/components/ChallengeQuestion";
import { DetectorMeter } from "@/components/DetectorMeter";
import { LiveTranscript } from "@/components/LiveTranscript";
import { TrustGauge } from "@/components/TrustGauge";
import { VerdictBanner } from "@/components/VerdictBanner";
import { startMicStreaming } from "@/lib/audio-capture";
import { useAuralStore } from "@/lib/store";
import type { TrustState, TrustVerdict } from "@/lib/types";
import { apiBase, openTrustSocket, sendPcmChunk } from "@/lib/ws";

export default function HomePage() {
  const trust = useAuralStore((s) => s.trust);
  const listening = useAuralStore((s) => s.listening);
  const setTrust = useAuralStore((s) => s.setTrust);
  const setListening = useAuralStore((s) => s.setListening);
  const resetSession = useAuralStore((s) => s.resetSession);

  const wsRef = useRef<WebSocket | null>(null);
  const micRef = useRef<{ stop: () => void } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => () => {
    micRef.current?.stop();
    wsRef.current?.close();
  }, []);

  const wireTrust = useCallback(
    (t: TrustState) => {
      setTrust(t);
    },
    [setTrust],
  );

  const stopAll = useCallback(() => {
    micRef.current?.stop();
    micRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    setListening(false);
  }, [setListening]);

  async function toggleMic() {
    if (listening) {
      stopAll();
      return;
    }
    resetSession();
    const ws = openTrustSocket({
      onTrust: wireTrust,
      onOpen: () => setListening(true),
      onClose: () => setListening(false),
      onError: () => setListening(false),
    });
    wsRef.current = ws;
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("timeout")), 8000);
      ws.addEventListener(
        "open",
        () => {
          clearTimeout(t);
          resolve();
        },
        { once: true },
      );
    }).catch(() => undefined);

    try {
      micRef.current = await startMicStreaming((payload) => sendPcmChunk(wsRef.current, payload));
    } catch {
      stopAll();
    }
  }

  async function uploadFile(f: File) {
    setUploading(true);
    resetSession();
    try {
      const fd = new FormData();
      fd.append("file", f);
      const r = await fetch(`${apiBase()}/upload`, { method: "POST", body: fd });
      const data = (await r.json()) as TrustState;
      wireTrust(data);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const verdict: TrustVerdict = trust?.verdict ?? "trusted";
  const score = trust?.trust_score ?? 100;
  const spoof = trust?.detectors?.antispoof?.spoof_prob ?? 0;
  const scam = trust?.detectors?.scam_pattern;
  const scamComposite =
    trust && scam
      ? Math.max(
          scam.urgency,
          scam.financial_request,
          scam.impersonation,
          scam.secrecy_pressure,
          scam.authority_threat,
        )
      : 0;
  const voicesIm = trust?.detectors?.voice_match?.similarity ?? -1;
  const voiceBar = trust ? Math.max(0, Math.min(1, (voicesIm + 1) / 2)) : 0.5;

  return (
    <div className="relative min-h-screen overflow-hidden pb-16 pt-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.14),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(244,63,94,0.08),transparent_55%)]" />

      <header className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-row items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-400/15 ring-1 ring-emerald-400/35">
            <Shield className="size-6 text-emerald-200" aria-hidden />
          </div>
          <div className="flex flex-col">
            <span className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--foreground)]">
              Aural
            </span>
            <span className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
              Live call shield
            </span>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void toggleMic()}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] ring-1 ring-white/15 hover:bg-white/15"
          >
            <Mic className="size-4" aria-hidden />
            {listening ? "Stop microphone" : "Start microphone"}
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] ring-1 ring-white/15 hover:bg-white/15 disabled:opacity-50"
          >
            <UploadCloud className="size-4" aria-hidden />
            Upload WAV
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="audio/wav,audio/x-wav,audio/wave"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadFile(file);
            }}
          />
          <Link
            href="/vault"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-100 ring-1 ring-emerald-400/35 hover:bg-emerald-500/25"
          >
            <Activity className="size-4" aria-hidden />
            Voice vault
          </Link>
        </nav>
      </header>

      <main className="relative mx-auto grid max-w-6xl gap-8 px-4 pt-10 lg:grid-cols-[1fr_320px]">
        <section className="flex flex-col gap-8">
          <VerdictBanner verdict={verdict} />
          {trust?.challenge_suggestion ? (
            <ChallengeQuestion text={trust.challenge_suggestion} />
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <DetectorMeter title="Synthetic voice" value01={spoof} />
            <DetectorMeter title="Scam patterns" value01={scamComposite} />
            <DetectorMeter title="Voice match" value01={voiceBar} invert />
          </div>

          <LiveTranscript text={trust?.transcript_partial ?? ""} phrases={scam?.trigger_phrases ?? []} />

          {trust?.reasons?.length ? (
            <ul className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-[var(--muted)]">
              {trust.reasons.map((r) => (
                <li key={r}>• {r}</li>
              ))}
            </ul>
          ) : null}
        </section>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-8 lg:self-start">
          <TrustGauge score={score} />
          <p className="text-center text-xs leading-relaxed text-[var(--muted)]">
            Fuses anti-spoofing, transcript cues, and vault voice-print checks. Runs locally — wire only
            used for your chosen LLM provider (OpenAI, Gemini, or Featherless).
          </p>
        </aside>
      </main>
    </div>
  );
}
