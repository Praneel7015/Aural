export type TrustVerdict = "trusted" | "suspicious" | "scam";

export type TrustState = {
  timestamp: number;
  trust_score: number;
  verdict: TrustVerdict;
  detectors: {
    antispoof: { spoof_prob: number; confidence: number };
    scam_pattern: {
      urgency: number;
      financial_request: number;
      impersonation: number;
      secrecy_pressure: number;
      authority_threat: number;
      trigger_phrases: string[];
    };
    voice_match: {
      best_match_contact: string | null;
      similarity: number;
      claimed_identity: string | null;
    };
  };
  transcript_partial: string;
  reasons: string[];
  challenge_suggestion: string | null;
  // Extended analysis (from Gemini)
  voice_reasoning?: string | null;
  scam_reasoning?: string | null;
  analysis_source?: "local" | "gemini" | "hybrid";
};
