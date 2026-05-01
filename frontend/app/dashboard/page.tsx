"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, Mic, UploadCloud, AudioWaveform, ChevronLeft } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

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
    <div className="relative min-h-screen bg-white text-black dark:bg-black dark:text-white transition-colors duration-300 font-sans pb-16 pt-24">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
            <AudioWaveform className="w-6 h-6" />
            <span>Aural</span>
          </Link>
          
          <nav className="flex items-center gap-4">
            <ThemeToggle />
            <Link 
              href="/"
              className="hidden md:flex items-center justify-center gap-1 text-sm font-medium text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative mx-auto grid max-w-6xl gap-8 px-4 pt-10 lg:grid-cols-[1fr_320px]">
        <section className="flex flex-col gap-8 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex flex-col">
              <h1 className="font-display text-4xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-sm text-black/60 dark:text-white/60 font-body">Live call shield analysis</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void toggleMic()}
                className="inline-flex items-center gap-2 rounded-md bg-black dark:bg-white px-4 py-2 text-sm font-bold text-white dark:text-black hover:scale-105 transition-transform"
              >
                <Mic className="size-4" aria-hidden />
                {listening ? "Stop microphone" : "Start microphone"}
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-md border border-black/20 dark:border-white/20 bg-transparent px-4 py-2 text-sm font-bold text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
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
                className="inline-flex items-center gap-2 rounded-md border border-black/20 dark:border-white/20 bg-transparent px-4 py-2 text-sm font-bold text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <Activity className="size-4" aria-hidden />
                Voice vault
              </Link>
            </div>
          </div>
        </section>

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
            <ul className="flex flex-col gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4 text-sm text-black/70 dark:text-white/70 font-body">
              {trust.reasons.map((r) => (
                <li key={r}>• {r}</li>
              ))}
            </ul>
          ) : null}
        </section>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          <TrustGauge score={score} />
          <p className="text-center text-xs leading-relaxed text-black/50 dark:text-white/50 font-body">
            Fuses anti-spoofing, transcript cues, and vault voice-print checks. Runs locally — wire only
            used for your chosen LLM provider.
          </p>
        </aside>
      </main>
    </div>
  );
}
