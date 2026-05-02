"use client";

import { useState, useEffect } from "react";
import { X, Mic, Upload, Play, Users } from "lucide-react";

const DISMISSED_KEY = "verity-onboarding-dismissed";

export function OnboardingCard() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="relative rounded-lg border border-border bg-card p-5">
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 top-3 cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <p className="text-sm font-semibold text-foreground">
        Welcome to Verity
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Real-time scam-call analysis in three steps:
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {[
          {
            Icon: Play,
            title: "Try a demo",
            desc: "Click any scenario in the Demo panel to see Verity in action.",
          },
          {
            Icon: Mic,
            title: "Analyze live",
            desc: "Click Listen to analyze audio from your microphone in real time.",
          },
          {
            Icon: Upload,
            title: "Upload a file",
            desc: "Drop any audio file (.wav, .mp3, .m4a) for instant analysis.",
          },
          {
            Icon: Users,
            title: "Enroll family voices",
            desc: "Add trusted contacts to the Voice Vault for speaker verification.",
          },
        ].map((step) => {
          const { Icon } = step;
          return (
            <div key={step.title} className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">{step.title}</p>
                <p className="text-[11px] text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
