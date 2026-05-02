"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text: string, phrases: string[]) {
  const cleaned = phrases.map((p) => p.trim()).filter(Boolean);
  if (!cleaned.length || !text) return text;

  const pattern = cleaned.map(escapeRegExp).sort((a, b) => b.length - a.length).join("|");
  if (!pattern) return text;

  const re = new RegExp(`(${pattern})`, "gi");
  const parts = text.split(re);

  return parts.map((part, i) => {
    const hit = cleaned.some((p) => part.toLowerCase() === p.toLowerCase());
    if (!hit) return part;
    const severe = /urgency|money|gift card|arrest|police|don'?t tell|wire|rupees|crypto|account|transfer/i.test(part);
    return (
      <mark
        key={i}
        className={`rounded-sm px-0.5 font-medium ${
          severe ? "bg-trust-danger/25 text-trust-danger" : "bg-trust-warn/20 text-trust-warn"
        }`}
      >
        {part}
      </mark>
    );
  });
}

export function LiveTranscript({ text, phrases }: { text: string; phrases: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const body = useMemo(() => highlightText(text, phrases), [text, phrases]);

  useEffect(() => {
    const el = ref.current;
    if (!el || hover) return;
    el.scrollTop = el.scrollHeight;
  }, [text, hover]);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-2.5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Transcript</p>
      </div>
      <div
        ref={ref}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="max-h-[200px] overflow-y-auto px-4 py-3"
      >
        {text ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground-secondary">{body}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Waiting for audio input...</p>
        )}
      </div>
    </div>
  );
}
