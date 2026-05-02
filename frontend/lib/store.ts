import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { TrustState } from "@/lib/types";

type Store = {
  trust: TrustState | null;
  listening: boolean;
  partialTranscript: string;
  settings: {
    provider: string;
    openaiKey: string;
    geminiKey: string;
  };
  setTrust: (t: TrustState | null) => void;
  setListening: (v: boolean) => void;
  appendTranscriptHint: (text: string) => void;
  resetSession: () => void;
  updateSettings: (settings: Partial<Store["settings"]>) => void;
};

export const useAuralStore = create<Store>()(
  persist(
    (set) => ({
      trust: null,
      listening: false,
      partialTranscript: "",
      settings: {
        provider: "openai",
        openaiKey: "",
        geminiKey: "",
      },
      setTrust: (t) =>
        set((s) => ({
          trust: t,
          partialTranscript: t?.transcript_partial ?? s.partialTranscript,
        })),
      setListening: (listening) => set({ listening }),
      appendTranscriptHint: (text) => set({ partialTranscript: text }),
      resetSession: () => set({ trust: null, partialTranscript: "", listening: false }),
      updateSettings: (newSettings) =>
        set((s) => ({ settings: { ...s.settings, ...newSettings } })),
    }),
    {
      name: "aural-storage",
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
