"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileText } from "lucide-react";

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
    <div className="relative flex flex-col gap-3 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-6 shadow-sm overflow-hidden group">
      {/* Header */}
      <div className="relative flex items-center gap-2 mb-2">
        <FileText className="w-5 h-5 text-black dark:text-white" />
        <span className="font-display font-bold text-sm tracking-widest text-black dark:text-white uppercase">
          Live Transcript
        </span>
      </div>
      
      <div
        ref={ref}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="relative max-h-[240px] overflow-y-auto font-body text-base md:text-lg leading-relaxed text-black/90 dark:text-white/90 pr-4 scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10"
      >
        {text ? (
          <p className="whitespace-pre-wrap">{body}</p>
        ) : (
          <div className="flex items-center gap-3 text-black/40 dark:text-white/40 italic h-12">
            <div className="flex gap-1.5 items-center">
              <span className="w-2 h-2 rounded-full bg-black/40 dark:bg-white/40 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-black/40 dark:bg-white/40 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-black/40 dark:bg-white/40 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-black/40 dark:text-white/40">
              Listening for speech...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
