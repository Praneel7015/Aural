import type { TrustState } from "@/lib/types";

export type DemoScenario = {
  id: string;
  name: string;
  description: string;
  tag: "scam" | "safe" | "suspicious";
  /** Frames are pushed at ~1s intervals to simulate real-time analysis */
  frames: TrustState[];
};

const ts = () => Date.now() / 1000;

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "grandparent-scam",
    name: "Grandparent Scam",
    description:
      "AI-cloned voice of a family member claims arrest and demands money urgently.",
    tag: "scam",
    frames: [
      {
        timestamp: ts(),
        trust_score: 92,
        verdict: "trusted",
        detectors: {
          antispoof: { spoof_prob: 0.12, confidence: 0.8 },
          scam_pattern: {
            urgency: 0.1,
            financial_request: 0.0,
            impersonation: 0.2,
            secrecy_pressure: 0.0,
            authority_threat: 0.0,
            trigger_phrases: [],
          },
          voice_match: {
            best_match_contact: "Aarav",
            similarity: 0.31,
            claimed_identity: null,
          },
        },
        transcript_partial: "Mom? Mom, can you hear me?",
        reasons: [],
        challenge_suggestion: null,
      },
      {
        timestamp: ts(),
        trust_score: 72,
        verdict: "suspicious",
        detectors: {
          antispoof: { spoof_prob: 0.58, confidence: 0.85 },
          scam_pattern: {
            urgency: 0.4,
            financial_request: 0.1,
            impersonation: 0.65,
            secrecy_pressure: 0.0,
            authority_threat: 0.2,
            trigger_phrases: ["Mom"],
          },
          voice_match: {
            best_match_contact: "Aarav",
            similarity: 0.28,
            claimed_identity: "son",
          },
        },
        transcript_partial:
          "Mom? Mom, can you hear me? It's me, your son. I'm in serious trouble right now.",
        reasons: [],
        challenge_suggestion:
          'Verify "son": Ask them what you ate for dinner last Sunday.',
      },
      {
        timestamp: ts(),
        trust_score: 38,
        verdict: "suspicious",
        detectors: {
          antispoof: { spoof_prob: 0.76, confidence: 0.9 },
          scam_pattern: {
            urgency: 0.8,
            financial_request: 0.6,
            impersonation: 0.8,
            secrecy_pressure: 0.3,
            authority_threat: 0.5,
            trigger_phrases: ["arrested", "trouble", "Mom"],
          },
          voice_match: {
            best_match_contact: "Aarav",
            similarity: 0.24,
            claimed_identity: "son",
          },
        },
        transcript_partial:
          "Mom? Mom, can you hear me? It's me, your son. I'm in serious trouble right now. I've been arrested. Please, I need your help.",
        reasons: [
          "Voice does not match enrolled 'son'",
        ],
        challenge_suggestion:
          'Verify "son": Ask them what your childhood pet\'s name was.',
      },
      {
        timestamp: ts(),
        trust_score: 14,
        verdict: "scam",
        detectors: {
          antispoof: { spoof_prob: 0.89, confidence: 0.93 },
          scam_pattern: {
            urgency: 0.92,
            financial_request: 0.88,
            impersonation: 0.85,
            secrecy_pressure: 0.75,
            authority_threat: 0.6,
            trigger_phrases: [
              "arrested",
              "ten thousand rupees",
              "don't tell dad",
            ],
          },
          voice_match: {
            best_match_contact: "Aarav",
            similarity: 0.23,
            claimed_identity: "son",
          },
        },
        transcript_partial:
          "Mom? Mom, can you hear me? It's me, your son. I'm in serious trouble right now. I've been arrested. Please, I need ten thousand rupees right now to post bail. Don't tell dad. The police won't let me go until I pay.",
        reasons: [
          "Voice appears synthetic (deepfake/TTS)",
          "Money request detected",
          "Pressure to keep call secret",
          "Voice does not match enrolled 'son'",
        ],
        challenge_suggestion:
          'Verify "son": Tell them the agreed safe word -- only the real person should know it.',
      },
      {
        timestamp: ts(),
        trust_score: 6,
        verdict: "scam",
        detectors: {
          antispoof: { spoof_prob: 0.94, confidence: 0.96 },
          scam_pattern: {
            urgency: 0.95,
            financial_request: 0.92,
            impersonation: 0.9,
            secrecy_pressure: 0.82,
            authority_threat: 0.65,
            trigger_phrases: [
              "arrested",
              "ten thousand rupees",
              "don't tell dad",
              "bail",
              "police",
            ],
          },
          voice_match: {
            best_match_contact: "Aarav",
            similarity: 0.23,
            claimed_identity: "son",
          },
        },
        transcript_partial:
          "Mom? Mom, can you hear me? It's me, your son. I'm in serious trouble right now. I've been arrested. Please, I need ten thousand rupees right now to post bail. Don't tell dad. The police won't let me go until I pay. Please hurry, they're going to take me to court. Send it to this account right now.",
        reasons: [
          "Voice appears synthetic (deepfake/TTS)",
          "Money request detected",
          "Pressure to keep call secret",
          "Voice does not match enrolled 'son'",
        ],
        challenge_suggestion:
          'Verify "son": Ask them what you ate for dinner last Sunday.',
      },
    ],
  },
  {
    id: "irs-threat",
    name: "IRS/Tax Authority Scam",
    description:
      "Impersonates the tax department with arrest threats and demands gift card payment.",
    tag: "scam",
    frames: [
      {
        timestamp: ts(),
        trust_score: 85,
        verdict: "trusted",
        detectors: {
          antispoof: { spoof_prob: 0.18, confidence: 0.75 },
          scam_pattern: {
            urgency: 0.1,
            financial_request: 0.0,
            impersonation: 0.3,
            secrecy_pressure: 0.0,
            authority_threat: 0.2,
            trigger_phrases: [],
          },
          voice_match: {
            best_match_contact: null,
            similarity: -1,
            claimed_identity: null,
          },
        },
        transcript_partial:
          "Hello, this is a call from the Income Tax Department regarding your account.",
        reasons: [],
        challenge_suggestion: null,
      },
      {
        timestamp: ts(),
        trust_score: 48,
        verdict: "suspicious",
        detectors: {
          antispoof: { spoof_prob: 0.42, confidence: 0.82 },
          scam_pattern: {
            urgency: 0.7,
            financial_request: 0.3,
            impersonation: 0.6,
            secrecy_pressure: 0.1,
            authority_threat: 0.82,
            trigger_phrases: [
              "warrant for your arrest",
              "Income Tax Department",
            ],
          },
          voice_match: {
            best_match_contact: null,
            similarity: -1,
            claimed_identity: "Income Tax Department",
          },
        },
        transcript_partial:
          "Hello, this is a call from the Income Tax Department regarding your account. There is an outstanding warrant for your arrest due to unpaid taxes.",
        reasons: ["Authority/legal threats"],
        challenge_suggestion: null,
      },
      {
        timestamp: ts(),
        trust_score: 12,
        verdict: "scam",
        detectors: {
          antispoof: { spoof_prob: 0.55, confidence: 0.88 },
          scam_pattern: {
            urgency: 0.93,
            financial_request: 0.9,
            impersonation: 0.75,
            secrecy_pressure: 0.2,
            authority_threat: 0.95,
            trigger_phrases: [
              "warrant for your arrest",
              "forty thousand rupees",
              "gift cards",
              "deportation",
            ],
          },
          voice_match: {
            best_match_contact: null,
            similarity: -1,
            claimed_identity: "Income Tax Department",
          },
        },
        transcript_partial:
          "Hello, this is a call from the Income Tax Department regarding your account. There is an outstanding warrant for your arrest due to unpaid taxes. You must pay forty thousand rupees in gift cards immediately or face deportation. Do not hang up this call.",
        reasons: [
          "Money request detected",
          "Authority/legal threats",
        ],
        challenge_suggestion: null,
      },
    ],
  },
  {
    id: "bank-fraud",
    name: "Bank Fraud Call",
    description:
      'Fake bank representative claims account compromise and asks to "move money to safe account".',
    tag: "scam",
    frames: [
      {
        timestamp: ts(),
        trust_score: 88,
        verdict: "trusted",
        detectors: {
          antispoof: { spoof_prob: 0.15, confidence: 0.78 },
          scam_pattern: {
            urgency: 0.15,
            financial_request: 0.1,
            impersonation: 0.35,
            secrecy_pressure: 0.0,
            authority_threat: 0.0,
            trigger_phrases: [],
          },
          voice_match: {
            best_match_contact: null,
            similarity: -1,
            claimed_identity: null,
          },
        },
        transcript_partial:
          "Good afternoon. This is the fraud department from your bank. We're calling about unusual activity on your account.",
        reasons: [],
        challenge_suggestion: null,
      },
      {
        timestamp: ts(),
        trust_score: 42,
        verdict: "suspicious",
        detectors: {
          antispoof: { spoof_prob: 0.38, confidence: 0.84 },
          scam_pattern: {
            urgency: 0.75,
            financial_request: 0.72,
            impersonation: 0.7,
            secrecy_pressure: 0.3,
            authority_threat: 0.3,
            trigger_phrases: [
              "compromised",
              "transfer your balance",
              "safe account",
            ],
          },
          voice_match: {
            best_match_contact: null,
            similarity: -1,
            claimed_identity: "bank",
          },
        },
        transcript_partial:
          "Good afternoon. This is the fraud department from your bank. We're calling about unusual activity on your account. Your account has been compromised. You need to immediately transfer your balance to this safe account number.",
        reasons: ["Money request detected"],
        challenge_suggestion: null,
      },
      {
        timestamp: ts(),
        trust_score: 15,
        verdict: "scam",
        detectors: {
          antispoof: { spoof_prob: 0.48, confidence: 0.88 },
          scam_pattern: {
            urgency: 0.88,
            financial_request: 0.92,
            impersonation: 0.8,
            secrecy_pressure: 0.65,
            authority_threat: 0.4,
            trigger_phrases: [
              "compromised",
              "transfer your balance",
              "safe account",
              "do not share this information",
            ],
          },
          voice_match: {
            best_match_contact: null,
            similarity: -1,
            claimed_identity: "bank",
          },
        },
        transcript_partial:
          "Good afternoon. This is the fraud department from your bank. We're calling about unusual activity on your account. Your account has been compromised. You need to immediately transfer your balance to this safe account number while we investigate. Please do not share this information with anyone else. Time is critical.",
        reasons: [
          "Money request detected",
          "Pressure to keep call secret",
        ],
        challenge_suggestion: null,
      },
    ],
  },
  {
    id: "safe-family-call",
    name: "Legitimate Family Call",
    description:
      "Real family member calling for a casual check-in. All signals green.",
    tag: "safe",
    frames: [
      {
        timestamp: ts(),
        trust_score: 96,
        verdict: "trusted",
        detectors: {
          antispoof: { spoof_prob: 0.04, confidence: 0.92 },
          scam_pattern: {
            urgency: 0.0,
            financial_request: 0.0,
            impersonation: 0.0,
            secrecy_pressure: 0.0,
            authority_threat: 0.0,
            trigger_phrases: [],
          },
          voice_match: {
            best_match_contact: "Aarav",
            similarity: 0.91,
            claimed_identity: null,
          },
        },
        transcript_partial: "Hey mom, how are you doing?",
        reasons: [],
        challenge_suggestion: null,
      },
      {
        timestamp: ts(),
        trust_score: 97,
        verdict: "trusted",
        detectors: {
          antispoof: { spoof_prob: 0.03, confidence: 0.94 },
          scam_pattern: {
            urgency: 0.0,
            financial_request: 0.0,
            impersonation: 0.0,
            secrecy_pressure: 0.0,
            authority_threat: 0.0,
            trigger_phrases: [],
          },
          voice_match: {
            best_match_contact: "Aarav",
            similarity: 0.93,
            claimed_identity: null,
          },
        },
        transcript_partial:
          "Hey mom, how are you doing? Just checking in. Dinner was great last night, by the way.",
        reasons: [],
        challenge_suggestion: null,
      },
      {
        timestamp: ts(),
        trust_score: 98,
        verdict: "trusted",
        detectors: {
          antispoof: { spoof_prob: 0.02, confidence: 0.96 },
          scam_pattern: {
            urgency: 0.0,
            financial_request: 0.0,
            impersonation: 0.0,
            secrecy_pressure: 0.0,
            authority_threat: 0.0,
            trigger_phrases: [],
          },
          voice_match: {
            best_match_contact: "Aarav",
            similarity: 0.95,
            claimed_identity: null,
          },
        },
        transcript_partial:
          "Hey mom, how are you doing? Just checking in. Dinner was great last night, by the way. Are we still on for Sunday? I'll bring dessert. Love you, talk soon.",
        reasons: [],
        challenge_suggestion: null,
      },
    ],
  },
];
