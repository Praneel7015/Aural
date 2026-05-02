"use client";

import { ShieldQuestion } from "lucide-react";

export function ChallengeQuestion({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border-l-[3px] border-l-trust-warn bg-trust-warn/10 px-4 py-3.5">
      <ShieldQuestion className="mt-0.5 h-5 w-5 shrink-0 text-trust-warn" aria-hidden />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-trust-warn">Verify identity</p>
        <p className="mt-1 text-sm leading-relaxed text-foreground-secondary">{text}</p>
      </div>
    </div>
  );
}
