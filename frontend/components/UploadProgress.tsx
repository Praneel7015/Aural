"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle } from "lucide-react";

type Stage = "uploading" | "detecting" | "transcribing" | "classifying" | "done";

const stages: { key: Stage; label: string }[] = [
  { key: "uploading", label: "Uploading audio" },
  { key: "detecting", label: "Analyzing voice authenticity" },
  { key: "transcribing", label: "Transcribing speech" },
  { key: "classifying", label: "Classifying scam patterns" },
  { key: "done", label: "Analysis complete" },
];

type Props = {
  active: boolean;
  stage: Stage;
};

export function UploadProgress({ active, stage }: Props) {
  if (!active) return null;

  const currentIdx = stages.findIndex((s) => s.key === stage);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="rounded-lg border border-border bg-card p-4"
      >
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Processing Pipeline
        </p>
        <div className="flex flex-col gap-2">
          {stages.map((s, i) => {
            const isDone = i < currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <div key={s.key} className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                  {isDone ? (
                    <CheckCircle className="h-4 w-4 text-trust-safe" />
                  ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 animate-spin text-foreground" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-border" />
                  )}
                </div>
                <span
                  className={`text-sm ${
                    isDone
                      ? "text-trust-safe"
                      : isCurrent
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-border">
          <motion.div
            className="h-full rounded-full bg-foreground"
            animate={{ width: `${((currentIdx + 1) / stages.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export type { Stage };
