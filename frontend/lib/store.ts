import { create } from "zustand";

import type { TrustState } from "@/lib/types";

export type ScorePoint = {
  time: number;
  score: number;
};

type Store = {
  trust: TrustState | null;
  listening: boolean;
  partialTranscript: string;
  scoreHistory: ScorePoint[];
  setTrust: (t: TrustState | null) => void;
  setListening: (v: boolean) => void;
  appendTranscriptHint: (text: string) => void;
  resetSession: () => void;
};

export const useVerityStore = create<Store>((set) => ({
  trust: null,
  listening: false,
  partialTranscript: "",
  scoreHistory: [],
  setTrust: (t) =>
    set((s) => ({
      trust: t,
      partialTranscript: t?.transcript_partial ?? s.partialTranscript,
      scoreHistory: t
        ? [...s.scoreHistory, { time: Date.now(), score: t.trust_score }].slice(-30)
        : s.scoreHistory,
    })),
  setListening: (listening) => set({ listening }),
  appendTranscriptHint: (text) => set({ partialTranscript: text }),
  resetSession: () => set({ trust: null, partialTranscript: "", listening: false, scoreHistory: [] }),
}));
