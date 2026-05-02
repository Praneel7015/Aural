"use client";

import Link from "next/link";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { ArrowRight, Shield, Mic, Upload, Users, Brain, Zap, Globe, Lock, FileText, BookOpen, AlertTriangle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function AnimatedScore({ target, duration = 2 }: { target: number; duration?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const count = useMotionValue(100);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(100);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, target, { duration, ease: "easeOut" });
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return () => { controls.stop(); unsub(); };
  }, [inView, count, rounded, target, duration]);

  function scoreColor(v: number) {
    if (v >= 70) return "text-trust-safe";
    if (v >= 40) return "text-trust-warn";
    return "text-trust-danger";
  }
  function borderColor(v: number) {
    if (v >= 70) return "border-trust-safe";
    if (v >= 40) return "border-trust-warn";
    return "border-trust-danger";
  }

  return (
    <div ref={ref} className={`mx-auto flex h-48 w-48 items-center justify-center rounded-full border-4 transition-colors duration-300 ${borderColor(display)}`}>
      <div className="text-center">
        <p className={`font-[family-name:var(--font-mono)] text-5xl font-bold tabular-nums transition-colors duration-300 ${scoreColor(display)}`}>
          {display}
        </p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {display >= 70 ? "Safe" : display >= 40 ? "Caution" : "Scam"}
        </p>
      </div>
    </div>
  );
}

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, target, { duration: 1.5, ease: "easeOut" });
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return () => { controls.stop(); unsub(); };
  }, [inView, count, rounded, target]);

  return <span ref={ref}>{display}{suffix}</span>;
}

const steps = [
  { num: "01", title: "Deepfake Detection", desc: "Wav2Vec2 + AASIST3 neural networks analyze raw audio to detect synthetic speech, voice cloning, and TTS artifacts. Gemini 2.5 provides noise-robust analysis." },
  { num: "02", title: "Scam Pattern Analysis", desc: "Gemini 2.5 Flash examines the live transcript for social engineering -- urgency, financial requests, authority threats, impersonation, and secrecy pressure." },
  { num: "03", title: "Speaker Verification", desc: "ECAPA-TDNN compares the caller's voiceprint against your Family Voice Vault. If they claim to be your son, the voice must match." },
];

const stats = [
  { value: "<2s", label: "Detection latency" },
  { value: "5", label: "ML models" },
  { value: "0", label: "Models trained" },
  { value: "8", label: "Languages" },
];

const competitors = [
  { name: "Hiya", scope: "Telecom networks", gap: "B2B only, no deepfake detection" },
  { name: "Pindrop", scope: "Banks & call centers", gap: "Enterprise pricing, no consumer app" },
  { name: "McAfee", scope: "Browser scam alerts", gap: "No real-time voice analysis" },
  { name: "Verity", scope: "Your family's phone", gap: "All three signals, free, on-device" },
];

const features = [
  { Icon: Mic, title: "Live Mic Analysis", desc: "Stream audio from your microphone for real-time call monitoring" },
  { Icon: Upload, title: "File Upload", desc: "Upload WAV, MP3, M4A, OGG files for instant analysis" },
  { Icon: Users, title: "Family Voice Vault", desc: "Enroll family voiceprints. Verify callers against trusted contacts" },
  { Icon: Shield, title: "Scam Alert Overlay", desc: "Full-screen emergency warning with action buttons when scam detected" },
  { Icon: FileText, title: "Forensic Reports", desc: "One-click export of HTML reports and raw JSON analysis data" },
  { Icon: Brain, title: "AI-Powered Reasoning", desc: "Gemini explains why a voice sounds synthetic or a call seems suspicious" },
  { Icon: Zap, title: "Demo Scenarios", desc: "4 pre-built scenarios to demo the system without a backend" },
  { Icon: Globe, title: "8 Languages", desc: "English, Hindi, Spanish, Tamil, French, German, Japanese, Chinese" },
  { Icon: Lock, title: "Privacy-First", desc: "No audio leaves your device. Voice Vault stays local. Zero cloud storage" },
  { Icon: AlertTriangle, title: "Threat Intelligence", desc: "Community feed showing active scam campaigns and trending attack types" },
  { Icon: BookOpen, title: "Scam Education", desc: "Interactive library of scam playbooks with a quiz to test your knowledge" },
  { Icon: Users, title: "Emergency Contacts", desc: "Quick-call buttons for trusted family members when a scam is detected" },
];

const useCases = [
  {
    title: "Grandparent Scam",
    scenario: "A scammer clones your grandson's voice from a WhatsApp note and calls demanding bail money.",
    detection: "Deepfake detector flags synthetic voice at 90%+. Scam classifier catches urgency and financial demand. Voice vault shows no match to enrolled grandson.",
    score: 6,
  },
  {
    title: "IRS Impersonation",
    scenario: "Automated call threatens arrest for unpaid taxes, demands payment via gift cards.",
    detection: "LLM detects authority threats (95%) and financial requests (90%). Trigger phrases flagged: 'warrant', 'arrest', 'gift cards'.",
    score: 12,
  },
  {
    title: "Bank Fraud",
    scenario: "Fake bank rep claims your account is compromised, asks you to transfer money to a 'safe account'.",
    detection: "Financial request (92%) and impersonation (80%) flagged. Secrecy pressure detected: 'don't share this information'.",
    score: 15,
  },
  {
    title: "Legitimate Family Call",
    scenario: "Your actual son calls to chat about weekend plans.",
    detection: "All scam signals at 0%. Deepfake probability 1%. Voice vault match: 95%. Trust Score: 98.",
    score: 98,
  },
];

const faqs = [
  { q: "How does Verity detect AI-cloned voices?", a: "We use three layers: a Wav2Vec2 model trained specifically on ElevenLabs and modern TTS, AASIST3 for older voice conversion attacks, and Gemini 2.5 Flash for noise-robust audio forensics. If any layer detects synthesis, the trust score drops." },
  { q: "Does it work with real human scammers (not AI)?", a: "Yes. Even when the voice is real, our LLM analyzes the transcript for social engineering patterns -- urgency, financial demands, authority threats, secrecy pressure. Real human scam calls are caught through content analysis." },
  { q: "What is the Family Voice Vault?", a: "You enroll 30-second voice samples of trusted contacts (family members). When someone calls claiming to be your son, Verity's ECAPA-TDNN model compares the caller's voiceprint against the enrolled sample. A clone may sound perfect to your ear, but the voiceprint won't match." },
  { q: "Is my audio data stored or shared?", a: "No. Audio analysis happens on-device or via encrypted API calls. No audio is stored on our servers. The Voice Vault is local to your device." },
  { q: "What languages are supported?", a: "Transcription supports English, Hindi, Spanish, Tamil, French, German, Japanese, and Chinese. The scam classifier works across all languages since it analyzes translated content." },
  { q: "How fast is the analysis?", a: "Under 2 seconds for real-time streaming. Uploaded files take 10-30 seconds depending on length. The Gemini combined analyzer does deepfake detection, transcription, and scam classification in a single API call." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/" className="font-[family-name:var(--font-brand)] text-lg font-semibold tracking-tight text-foreground">
            Verity
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <a href="#features" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline">Features</a>
            <a href="#how-it-works" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:inline">How it works</a>
            <a href="#faq" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:inline">FAQ</a>
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Open Dashboard
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 pb-20 pt-20 sm:px-6 md:pt-28">
          <div className="mx-auto max-w-2xl text-center">
            <FadeUp>
              <p className="mb-5 text-xs font-medium uppercase tracking-[0.2em] text-foreground/60">
                Real-time AI scam-call shield
              </p>
            </FadeUp>
            <FadeUp delay={0.08}>
              <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-foreground md:text-5xl lg:text-[3.5rem]">
                Detect voice scams<br className="hidden sm:block" /> before they start
              </h1>
            </FadeUp>
            <FadeUp delay={0.16}>
              <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
                Verity fuses deepfake detection, social-engineering analysis, and speaker verification
                into a single trust score -- in under two seconds.
              </p>
            </FadeUp>
            <FadeUp delay={0.24}>
              <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/dashboard"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
                >
                  Launch Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-card"
                >
                  How it works
                </a>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((s, i) => (
              <FadeUp key={s.label} delay={i * 0.08} className="text-center">
                <p className="font-[family-name:var(--font-mono)] text-2xl font-bold text-foreground md:text-3xl">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <FadeUp>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-trust-danger/80">The Problem</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                AI voice clones are undetectable to the human ear
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                A 30-second voice sample from a WhatsApp note or social media video is enough to clone
                anyone&apos;s voice. Scammers use these clones to impersonate family members, demanding
                money while the victim hears their loved one&apos;s voice begging for help.
              </p>
              <div className="mt-6 flex flex-col gap-2.5">
                {[
                  { stat: "$1B+", desc: "stolen from families via voice scams in 2025" },
                  { stat: "30s", desc: "of audio needed to clone any voice" },
                  { stat: "77%", desc: "of victims could not tell the clone from the real voice" },
                  { stat: "400%", desc: "increase in AI voice scam reports year-over-year" },
                ].map((item) => (
                  <div key={item.stat} className="flex items-center gap-3">
                    <span className="w-14 font-[family-name:var(--font-mono)] text-sm font-bold text-trust-danger">{item.stat}</span>
                    <span className="text-sm text-muted-foreground">{item.desc}</span>
                  </div>
                ))}
              </div>
            </FadeUp>
            <FadeUp delay={0.15}>
              <div className="rounded-lg border border-trust-danger/30 bg-trust-danger/10 p-6">
                <p className="mb-3 font-[family-name:var(--font-mono)] text-xs text-trust-danger">Typical scam call transcript</p>
                <p className="text-sm leading-relaxed italic text-foreground-secondary">
                  &quot;Mom, please, I&apos;ve been arrested and I need ten thousand rupees
                  right now. Don&apos;t tell dad. The police won&apos;t let me go until I pay
                  this. Please hurry.&quot;
                </p>
                <div className="mt-4 flex items-center gap-2 border-t border-trust-danger/30 pt-4">
                  <span className="rounded bg-trust-danger/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-trust-danger">
                    AI Clone
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Generated from a 30-second voice sample
                  </span>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-16 border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <FadeUp className="mb-14">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/60">Architecture</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Three signals, one verdict</h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Each layer runs independently. The Trust Engine fuses all outputs into a single 0-100 score.
              If any signal fires, the score drops. Defense in depth -- one layer failing doesn&apos;t matter.
            </p>
          </FadeUp>
          <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
            {steps.map((step, i) => (
              <FadeUp key={step.title} delay={i * 0.1}>
                <div className="flex h-full flex-col bg-card p-6">
                  <span className="mb-3 font-[family-name:var(--font-mono)] text-xs text-muted-foreground">{step.num}</span>
                  <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Score demo */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <FadeUp>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/60">Live Output</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">One score. Full transparency.</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                The Trust Score starts at 100. Each red flag subtracts points: synthetic voice detected,
                financial request identified, voiceprint mismatch confirmed. You see exactly why a call is flagged.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                {[
                  { range: "70-100", label: "Trusted", cls: "text-trust-safe" },
                  { range: "40-69", label: "Suspicious", cls: "text-trust-warn" },
                  { range: "0-39", label: "Scam detected", cls: "text-trust-danger" },
                ].map((item) => (
                  <div key={item.range} className="flex items-center gap-3 text-sm">
                    <span className="w-14 font-[family-name:var(--font-mono)] text-xs text-muted-foreground">{item.range}</span>
                    <span className={`font-medium ${item.cls}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </FadeUp>
            <FadeUp delay={0.15}>
              <div className="rounded-lg border border-border bg-card p-8">
                <AnimatedScore target={6} duration={2.5} />
                <div className="mt-8 flex flex-col gap-2.5 text-sm">
                  <div className="flex items-center justify-between border-b border-border pb-2.5">
                    <span className="text-muted-foreground">Synthetic voice</span>
                    <span className="font-[family-name:var(--font-mono)] font-medium text-trust-danger">94%</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border pb-2.5">
                    <span className="text-muted-foreground">Scam patterns</span>
                    <span className="font-[family-name:var(--font-mono)] font-medium text-trust-danger">91%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Voice match</span>
                    <span className="font-[family-name:var(--font-mono)] font-medium text-trust-danger">23%</span>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <FadeUp className="mb-14">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/60">Real Scenarios</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">See Verity in action</h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Four real-world scenarios showing how the three detection layers work together.
              Try them yourself in the dashboard&apos;s Demo Scenarios panel.
            </p>
          </FadeUp>
          <div className="grid gap-4 sm:grid-cols-2">
            {useCases.map((uc, i) => (
              <FadeUp key={uc.title} delay={i * 0.08}>
                <div className="flex h-full flex-col rounded-lg border border-border bg-background p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">{uc.title}</h3>
                    <span className={`font-[family-name:var(--font-mono)] text-lg font-bold ${uc.score >= 70 ? "text-trust-safe" : uc.score >= 40 ? "text-trust-warn" : "text-trust-danger"}`}>
                      {uc.score}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{uc.scenario}</p>
                  <div className="mt-3 flex-1 rounded-md bg-muted p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Detection</p>
                    <p className="mt-1 text-xs leading-relaxed text-foreground-secondary">{uc.detection}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="scroll-mt-16 border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <FadeUp className="mb-14">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/60">Platform</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Everything you need</h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Not just detection -- a complete protection platform with forensic reporting,
              education, threat intelligence, and family safety tools.
            </p>
          </FadeUp>
          <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 md:grid-cols-3">
            {features.map((f, i) => {
              const { Icon } = f;
              return (
                <FadeUp key={f.title} delay={i * 0.04}>
                  <div className="flex h-full flex-col bg-card p-5">
                    <Icon className="mb-3 h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                    <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
                  </div>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </section>

      {/* Family Voice Vault */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <FadeUp delay={0.1} className="order-2 md:order-1">
              <div className="rounded-lg border border-border bg-background p-6">
                <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Voice Vault</p>
                <div className="flex flex-col gap-2">
                  {[
                    { name: "Aarav", rel: "Son", match: "98%" },
                    { name: "Priya", rel: "Daughter", match: "96%" },
                    { name: "Mom", rel: "Mother", match: "94%" },
                  ].map((c) => (
                    <div key={c.name} className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.rel}</p>
                      </div>
                      <span className="font-[family-name:var(--font-mono)] text-sm font-medium text-trust-safe">{c.match}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
            <FadeUp className="order-1 md:order-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/60">Protection</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Family Voice Vault</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Enroll a 30-second voice sample of each family member. When someone calls claiming
                to be your son, Verity checks the voiceprint against the vault -- exposing clones
                that sound identical to the human ear.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                The vault uses ECAPA-TDNN to create 192-dimensional voiceprint embeddings stored locally
                on your device. No biometric data ever leaves your phone.
              </p>
              <Link
                href="/vault"
                className="mt-6 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground transition-opacity hover:opacity-70"
              >
                Open Voice Vault
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Competitive positioning */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <FadeUp className="mb-14">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/60">Landscape</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Why not the existing players?</h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Scam-call protection exists -- for telecom networks, banks, and browsers.
              Nobody protects the consumer from AI voice clones. Until now.
            </p>
          </FadeUp>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-border bg-card text-left">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Solution</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Protects</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gap</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c) => (
                  <tr key={c.name} className={`border-b border-border last:border-b-0 ${c.name === "Verity" ? "bg-trust-safe/10" : "bg-background"}`}>
                    <td className={`px-4 py-3 font-medium ${c.name === "Verity" ? "text-trust-safe" : "text-foreground"}`}>{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.scope}</td>
                    <td className={`px-4 py-3 ${c.name === "Verity" ? "font-medium text-trust-safe" : "text-muted-foreground"}`}>{c.gap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <FadeUp className="mb-14">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/60">Under the Hood</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">5 models. Zero training. Ship-ready.</h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Every ML component is a pretrained downloadable artifact. We built the fusion and the product, not the models.
            </p>
          </FadeUp>
          <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
            {[
              { name: "Gemini 2.5", role: "Audio Forensics", detail: "Noise-robust deepfake + scam + transcript in 1 call" },
              { name: "Wav2Vec2", role: "Deepfake Detection", detail: "XLS-R 300M fine-tuned on ElevenLabs" },
              { name: "AASIST3", role: "Anti-Spoofing", detail: "KAN + GAT for voice conversion attacks" },
              { name: "ECAPA-TDNN", role: "Speaker Verify", detail: "192-dim voiceprint embeddings" },
              { name: "Whisper", role: "Transcription", detail: "distil-large-v3, 8 languages" },
            ].map((m, i) => (
              <FadeUp key={m.name} delay={i * 0.06}>
                <div className="flex h-full flex-col bg-card p-5">
                  <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-muted-foreground">{m.role}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{m.name}</p>
                  <p className="mt-1 flex-1 text-xs text-muted-foreground">{m.detail}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-16 border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <FadeUp className="mb-14 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/60">FAQ</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Frequently asked questions</h2>
          </FadeUp>
          <div className="flex flex-col gap-3">
            {faqs.map((faq, i) => (
              <FadeUp key={faq.q} delay={i * 0.05}>
                <details className="group rounded-lg border border-border bg-card">
                  <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-medium text-foreground">
                    {faq.q}
                    <span className="ml-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <div className="border-t border-border px-5 py-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                  </div>
                </details>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
          <FadeUp>
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Protect the phone in your grandmother&apos;s hand
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              AI voice scams stole over a billion dollars from families globally in 2025.
              The voice is real. The crime is invisible. Verity makes it visible.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/dashboard"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-foreground px-8 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                Try Verity Now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/learn"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-8 py-3 text-sm font-medium text-foreground transition-colors hover:bg-background"
              >
                Learn About Scams
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-[family-name:var(--font-brand)] text-sm font-semibold text-foreground">Verity</p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                Real-time AI scam-call shield. Built for the Octoverse Student Hackathon.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Product</p>
                <div className="mt-2 flex flex-col gap-1.5">
                  <Link href="/dashboard" className="text-xs text-muted-foreground transition-colors hover:text-foreground">Dashboard</Link>
                  <Link href="/vault" className="text-xs text-muted-foreground transition-colors hover:text-foreground">Voice Vault</Link>
                  <Link href="/threats" className="text-xs text-muted-foreground transition-colors hover:text-foreground">Threat Feed</Link>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Resources</p>
                <div className="mt-2 flex flex-col gap-1.5">
                  <Link href="/learn" className="text-xs text-muted-foreground transition-colors hover:text-foreground">Scam Education</Link>
                  <Link href="/settings" className="text-xs text-muted-foreground transition-colors hover:text-foreground">Settings</Link>
                  <a href="#faq" className="text-xs text-muted-foreground transition-colors hover:text-foreground">FAQ</a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-6 text-center text-[10px] text-muted-foreground">
            Verity -- Built for Octoverse Student Hackathon 2026
          </div>
        </div>
      </footer>
    </div>
  );
}
