"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text: string, phrases: string[]) {
  const cleaned = phrases.map((p) => p.trim()).filter(Boolean);
  if (!cleaned.length || !text) return text;

  const pattern = cleaned
    .map(escapeRegExp)
    .sort((a, b) => b.length - a.length)
    .join("|");
  if (!pattern) return text;

  const re = new RegExp(`(${pattern})`, "gi");
  const parts = text.split(re);

  return parts.map((part, i) => {
    const hit = cleaned.some((p) => part.toLowerCase() === p.toLowerCase());
    if (!hit) return part;
    const Hi =
      /urgency|money|gift card|arrest|police|don'?t tell/i.test(part) ||
      /wire|rupees|crypto|account/i.test(part);
    return (
      <mark
        key={i}
        className={cn(
          "rounded px-1 font-bold",
          Hi ? "bg-rose-500/35 text-rose-900 dark:text-rose-50" : "bg-amber-500/30 text-amber-900 dark:text-amber-50",
        )}
      >
        {part}
      </mark>
    );
  });
}

export function LiveTranscript({
  text,
  phrases,
}: {
  text: string;
  phrases: string[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);

  const body = useMemo(() => highlightText(text, phrases), [text, phrases]);

  useEffect(() => {
    const el = ref.current;
    if (!el || hover) return;
    el.scrollTop = el.scrollHeight;
  }, [text, hover]);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="max-h-[220px] overflow-y-auto rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4 font-body text-sm leading-relaxed text-black dark:text-white shadow-inner"
    >
      {text ? (
        <p className="whitespace-pre-wrap">{body}</p>
      ) : (
        <p className="text-black/50 dark:text-white/50 italic">Transcript appears as the call is processed…</p>
      )}
    </div>
  );
}
