import { create } from "zustand";

import type { TrustState } from "@/lib/types";

type Store = {
  trust: TrustState | null;
  listening: boolean;
  partialTranscript: string;
  setTrust: (t: TrustState | null) => void;
  setListening: (v: boolean) => void;
  appendTranscriptHint: (text: string) => void;
  resetSession: () => void;
};

export const useAuralStore = create<Store>((set) => ({
  trust: null,
  listening: false,
  partialTranscript: "",
  setTrust: (t) =>
    set((s) => ({
      trust: t,
      partialTranscript: t?.transcript_partial ?? s.partialTranscript,
    })),
  setListening: (listening) => set({ listening }),
  appendTranscriptHint: (text) => set({ partialTranscript: text }),
  resetSession: () => set({ trust: null, partialTranscript: "", listening: false }),
}));
