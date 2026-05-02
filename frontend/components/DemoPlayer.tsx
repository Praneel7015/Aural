"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, AlertTriangle, ShieldCheck, ShieldX } from "lucide-react";
import { DEMO_SCENARIOS, type DemoScenario } from "@/lib/demo-scenarios";
import type { TrustState } from "@/lib/types";

type Props = {
  onFrame: (state: TrustState) => void;
  onComplete: (scenario: DemoScenario, finalState: TrustState) => void;
  onStart: () => void;
};

const tagConfig = {
  scam: { cls: "border-trust-danger/30 bg-trust-danger/10 text-trust-danger", Icon: ShieldX },
  suspicious: { cls: "border-trust-warn/30 bg-trust-warn/10 text-trust-warn", Icon: AlertTriangle },
  safe: { cls: "border-trust-safe/30 bg-trust-safe/10 text-trust-safe", Icon: ShieldCheck },
};

export function DemoPlayer({ onFrame, onComplete, onStart }: Props) {
  const [playing, setPlaying] = useState<string | null>(null);
  const [frameIdx, setFrameIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setPlaying(null);
    setFrameIdx(0);
  }, []);

  const play = useCallback(
    (scenario: DemoScenario) => {
      stop();
      onStart();
      setPlaying(scenario.id);
      setFrameIdx(0);

      let idx = 0;
      // Push first frame immediately
      onFrame({ ...scenario.frames[0], timestamp: Date.now() / 1000 });

      intervalRef.current = setInterval(() => {
        idx++;
        if (idx >= scenario.frames.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          const final = scenario.frames[scenario.frames.length - 1];
          onComplete(scenario, { ...final, timestamp: Date.now() / 1000 });
          setPlaying(null);
          setFrameIdx(0);
          return;
        }
        setFrameIdx(idx);
        onFrame({ ...scenario.frames[idx], timestamp: Date.now() / 1000 });
      }, 1800);
    },
    [stop, onFrame, onComplete, onStart],
  );

  useEffect(() => () => stop(), [stop]);

  const activeScenario = DEMO_SCENARIOS.find((s) => s.id === playing);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-2.5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Demo Scenarios
        </p>
      </div>
      <div className="flex flex-col gap-2 p-3">
        {DEMO_SCENARIOS.map((scenario) => {
          const isPlaying = playing === scenario.id;
          const tag = tagConfig[scenario.tag];
          const { Icon } = tag;
          return (
            <button
              key={scenario.id}
              type="button"
              disabled={playing !== null && !isPlaying}
              onClick={() => (isPlaying ? stop() : play(scenario))}
              className={`group flex w-full cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                isPlaying
                  ? "border-foreground/20 bg-foreground/5"
                  : "border-border hover:bg-muted"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isPlaying ? (
                  <Square className="h-4 w-4 text-trust-danger" />
                ) : (
                  <Play className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {scenario.name}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${tag.cls}`}
                  >
                    <Icon className="h-2.5 w-2.5" />
                    {scenario.tag}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {scenario.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress */}
      <AnimatePresence>
        {activeScenario && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="px-4 py-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Frame {frameIdx + 1} of {activeScenario.frames.length}
                </span>
                <span className="font-[family-name:var(--font-mono)]">
                  {Math.round(((frameIdx + 1) / activeScenario.frames.length) * 100)}%
                </span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
                <motion.div
                  className="h-full rounded-full bg-foreground"
                  animate={{
                    width: `${((frameIdx + 1) / activeScenario.frames.length) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
