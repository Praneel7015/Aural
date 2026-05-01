"use client";

import { ShieldAlert } from "lucide-react";

export function ChallengeQuestion({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-amber-900 dark:text-amber-50">
      <div className="flex flex-row items-center gap-2 text-sm font-bold uppercase tracking-wide">
        <ShieldAlert className="size-5 shrink-0 opacity-90" aria-hidden />
        Verify identity
      </div>
      <p className="font-body text-sm leading-relaxed">{text}</p>
    </div>
  );
}
