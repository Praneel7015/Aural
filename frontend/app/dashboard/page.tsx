"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mic, MicOff, Upload, Users, Shield, BookOpen, Settings } from "lucide-react";

import { AnalyticsBar } from "@/components/AnalyticsBar";
import { CallHistory } from "@/components/CallHistory";
import { ChallengeQuestion } from "@/components/ChallengeQuestion";
import { CompareMode } from "@/components/CompareMode";
import { DemoPlayer } from "@/components/DemoPlayer";
import { DetailedAnalysis } from "@/components/DetailedAnalysis";
import { DetectorMeter } from "@/components/DetectorMeter";
import { ForensicExport } from "@/components/ForensicExport";
import { LiveTranscript } from "@/components/LiveTranscript";
import { OnboardingCard } from "@/components/OnboardingCard";
import { ScamOverlay } from "@/components/ScamOverlay";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TrustGauge } from "@/components/TrustGauge";
import { TrustTimeline } from "@/components/TrustTimeline";
import { UploadProgress, type Stage } from "@/components/UploadProgress";
import { VerdictBanner } from "@/components/VerdictBanner";
import { Waveform } from "@/components/Waveform";
import { startMicStreaming } from "@/lib/audio-capture";
import { createRecord, saveRecord } from "@/lib/call-history";
import type { DemoScenario } from "@/lib/demo-scenarios";
import { useVerityStore } from "@/lib/store";
import type { TrustState, TrustVerdict } from "@/lib/types";
import { apiBase, openTrustSocket, sendPcmChunk } from "@/lib/ws";

export default function DashboardPage() {
  const trust = useVerityStore((s) => s.trust);
  const listening = useVerityStore((s) => s.listening);
  const setTrust = useVerityStore((s) => s.setTrust);
  const setListening = useVerityStore((s) => s.setListening);
  const resetSession = useVerityStore((s) => s.resetSession);

  const wsRef = useRef<WebSocket | null>(null);
  const micRef = useRef<{ stop: () => void } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<Stage>("uploading");
  const [backendUp, setBackendUp] = useState<boolean | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [demoPlaying, setDemoPlaying] = useState(false);
  const [showScamOverlay, setShowScamOverlay] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const prevVerdictRef = useRef<TrustVerdict | null>(null);

  // Check backend health
  useEffect(() => {
    fetch(`${apiBase()}/health`)
      .then((r) => setBackendUp(r.ok))
      .catch(() => setBackendUp(false));
  }, []);

  // Cleanup on unmount
  useEffect(
    () => () => {
      micRef.current?.stop();
      wsRef.current?.close();
    },
    [],
  );

  // Show scam overlay when verdict transitions to "scam"
  useEffect(() => {
    if (trust?.verdict === "scam" && prevVerdictRef.current !== "scam") {
      setShowScamOverlay(true);
    }
    prevVerdictRef.current = trust?.verdict ?? null;
  }, [trust?.verdict]);

  const wireTrust = useCallback(
    (t: TrustState) => setTrust(t),
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
      // Save to history on stop
      if (trust) {
        saveRecord(createRecord(trust, "mic"));
        setHistoryRefresh((v) => v + 1);
      }
      stopAll();
      return;
    }
    resetSession();
    setConnecting(true);
    const ws = openTrustSocket({
      onTrust: wireTrust,
      onOpen: () => {
        setListening(true);
        setConnecting(false);
      },
      onClose: () => {
        setListening(false);
        setConnecting(false);
      },
      onError: () => {
        setListening(false);
        setConnecting(false);
      },
    });
    wsRef.current = ws;
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("timeout")), 8000);
      ws.addEventListener("open", () => { clearTimeout(t); resolve(); }, { once: true });
    }).catch(() => { setConnecting(false); });
    try {
      micRef.current = await startMicStreaming((payload) =>
        sendPcmChunk(wsRef.current, payload),
      );
    } catch {
      stopAll();
      setConnecting(false);
    }
  }

  async function uploadFile(f: File) {
    setUploading(true);
    setUploadStage("uploading");
    resetSession();
    try {
      const fd = new FormData();
      fd.append("file", f);
      setUploadStage("detecting");
      const r = await fetch(`${apiBase()}/upload`, { method: "POST", body: fd });
      setUploadStage("classifying");
      const data = (await r.json()) as TrustState;
      setUploadStage("done");
      wireTrust(data);
      saveRecord(createRecord(data, "upload"));
      setHistoryRefresh((v) => v + 1);
    } finally {
      setTimeout(() => setUploading(false), 800);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // Demo callbacks
  const handleDemoFrame = useCallback(
    (state: TrustState) => {
      setTrust(state);
    },
    [setTrust],
  );

  const handleDemoComplete = useCallback(
    (scenario: DemoScenario, finalState: TrustState) => {
      setDemoPlaying(false);
      saveRecord(createRecord(finalState, "demo", scenario.id));
      setHistoryRefresh((v) => v + 1);
    },
    [],
  );

  const handleDemoStart = useCallback(() => {
    resetSession();
    setDemoPlaying(true);
  }, [resetSession]);

  const handleHistorySelect = useCallback(
    (record: { fullState: TrustState }) => {
      setTrust(record.fullState);
    },
    [setTrust],
  );

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
  const voiceSim = trust?.detectors?.voice_match?.similarity ?? -1;
  const voiceBar = trust ? Math.max(0, Math.min(1, (voiceSim + 1) / 2)) : 0;

  const isActive = listening || demoPlaying || uploading;

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Scam overlay */}
      <ScamOverlay
        visible={showScamOverlay}
        score={score}
        reasons={trust?.reasons ?? []}
        onDismiss={() => setShowScamOverlay(false)}
      />

      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-[family-name:var(--font-brand)] text-base font-semibold tracking-tight text-foreground"
            >
              Verity
            </Link>
            <div className="hidden h-4 w-px bg-border sm:block" />
            <span className="hidden text-xs font-medium text-muted-foreground sm:block">
              Dashboard
            </span>
          </div>
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => void toggleMic()}
              disabled={demoPlaying}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:gap-2 sm:px-3 ${
                listening
                  ? "bg-trust-danger/10 text-trust-danger ring-1 ring-trust-danger/25"
                  : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {listening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
              <span className="hidden xs:inline">{listening ? "Stop" : "Listen"}</span>
            </button>
            <button
              type="button"
              disabled={uploading || demoPlaying}
              onClick={() => fileRef.current?.click()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 sm:gap-2 sm:px-3"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="audio/*,.wav,.mp3,.m4a,.ogg,.webm,.flac"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadFile(f);
              }}
            />
            <Link
              href="/vault"
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:gap-2 sm:px-3 sm:py-1.5"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline text-sm font-medium">Vault</span>
            </Link>
            <Link
              href="/threats"
              className="hidden cursor-pointer items-center justify-center rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex sm:gap-2 sm:px-3 sm:py-1.5"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden md:inline text-sm font-medium">Threats</span>
            </Link>
            <Link
              href="/learn"
              className="hidden cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:inline-flex"
            >
              <BookOpen className="h-4 w-4" />
              Learn
            </Link>
            <Link
              href="/settings"
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Backend status */}
      {backendUp === false && (
        <div className="border-b border-trust-warn/25 bg-trust-warn/10 px-6 py-2.5 text-center text-sm text-trust-warn">
          Backend offline -- use Demo Scenarios below to test the dashboard.
        </div>
      )}

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6">
        {/* Analytics bar */}
        <AnalyticsBar refreshKey={historyRefresh} />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Main column */}
          <div className="flex flex-col gap-5">
            <VerdictBanner verdict={verdict} />

            {trust?.challenge_suggestion && (
              <ChallengeQuestion text={trust.challenge_suggestion} />
            )}

            {/* Waveform */}
            <Waveform active={isActive} verdict={verdict} />

            {/* Detectors */}
            <div className="grid gap-4 sm:grid-cols-3">
              <DetectorMeter
                title="Synthetic Voice"
                value01={spoof}
                subtitle="Deepfake probability"
              />
              <DetectorMeter
                title="Scam Patterns"
                value01={scamComposite}
                subtitle="Social engineering signals"
              />
              <DetectorMeter
                title="Voice Match"
                value01={voiceBar}
                invert
                subtitle="Vault speaker similarity"
              />
            </div>

            {/* Trust timeline */}
            <TrustTimeline />

            {/* Transcript */}
            <LiveTranscript
              text={trust?.transcript_partial ?? ""}
              phrases={scam?.trigger_phrases ?? []}
            />

            {/* Flags */}
            {trust?.reasons?.length ? (
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Flags
                </p>
                <ul className="flex flex-col gap-1.5">
                  {trust.reasons.map((r) => (
                    <li key={r} className="text-sm text-foreground-secondary">
                      <span className="mr-2 text-trust-danger">--</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Upload progress */}
            <UploadProgress active={uploading} stage={uploadStage} />

            {/* Detailed analysis panel */}
            {trust && (spoof > 0.05 || scamComposite > 0.05 || trust.analysis_source === "gemini") && (
              <DetailedAnalysis state={trust} />
            )}

            {/* Compare mode */}
            {!listening && !demoPlaying && !uploading && (
              <CompareMode />
            )}
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
            {/* Trust score gauge */}
            <div className="rounded-lg border border-border bg-card p-6">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Trust Score
              </p>
              <TrustGauge score={score} />
              {trust && (
                <div className="mt-3 space-y-1 text-center">
                  <p className="font-[family-name:var(--font-mono)] text-xs text-muted-foreground">
                    {trust.detectors.voice_match.best_match_contact
                      ? `Matched: ${trust.detectors.voice_match.best_match_contact}`
                      : "No vault match"}
                  </p>
                  {trust.detectors.voice_match.claimed_identity && (
                    <p className="text-xs text-trust-warn">
                      Claims to be: {trust.detectors.voice_match.claimed_identity}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Status indicators */}
            {connecting && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Connecting...
                </span>
              </div>
            )}
            {listening && (
              <div className="flex items-center gap-2 rounded-lg border border-trust-safe/25 bg-trust-safe/10 px-4 py-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-trust-safe opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-trust-safe" />
                </span>
                <span className="text-sm font-medium text-trust-safe">
                  Listening
                </span>
              </div>
            )}
            {uploading && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Processing audio...
                </span>
              </div>
            )}
            {demoPlaying && (
              <div className="flex items-center gap-2 rounded-lg border border-aural-accent/25 bg-aural-accent/10 px-4 py-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aural-accent opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-aural-accent" />
                </span>
                <span className="text-sm font-medium text-foreground">
                  Demo playing
                </span>
              </div>
            )}

            {/* Forensic export */}
            {trust && <ForensicExport state={trust} />}

            {/* Demo scenarios */}
            <DemoPlayer
              onFrame={handleDemoFrame}
              onComplete={handleDemoComplete}
              onStart={handleDemoStart}
            />

            {/* Call history */}
            <CallHistory
              refreshKey={historyRefresh}
              onSelect={handleHistorySelect}
            />

            {/* Onboarding */}
            <OnboardingCard />
          </aside>
        </div>
      </main>
    </div>
  );
}
