"use client";

import { useCallback, useEffect, useRef } from "react";

type Props = {
  active: boolean;
  verdict?: "trusted" | "suspicious" | "scam";
};

function getVarName(verdict: Props["verdict"]): string {
  switch (verdict) {
    case "scam":
      return "--trust-danger";
    case "suspicious":
      return "--trust-warn";
    default:
      return "--trust-safe";
  }
}

export function Waveform({ active, verdict = "trusted" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barsRef = useRef<number[]>([]);
  const rafRef = useRef<number>(0);

  const BAR_COUNT = 48;
  const BAR_GAP = 2;

  useEffect(() => {
    if (!barsRef.current.length) {
      barsRef.current = Array.from({ length: BAR_COUNT }, () => 0.05);
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const barW = (w - BAR_GAP * (BAR_COUNT - 1)) / BAR_COUNT;

    // Resolve CSS variable to actual color value
    const varName = getVarName(verdict);
    const color = getComputedStyle(canvas).getPropertyValue(varName).trim() || "#34d399";

    ctx.clearRect(0, 0, w, h);

    const bars = barsRef.current;
    for (let i = 0; i < bars.length; i++) {
      if (active) {
        const target = 0.15 + Math.random() * 0.85;
        bars[i] += (target - bars[i]) * 0.18;
      } else {
        bars[i] += (0.05 - bars[i]) * 0.1;
      }

      const barH = Math.max(2, bars[i] * h * 0.9);
      const x = i * (barW + BAR_GAP);
      const y = (h - barH) / 2;

      ctx.globalAlpha = 0.4 + bars[i] * 0.6;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 1);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    rafRef.current = requestAnimationFrame(draw);
  }, [active, verdict]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="h-12 w-full rounded-lg border border-border bg-card"
    />
  );
}
