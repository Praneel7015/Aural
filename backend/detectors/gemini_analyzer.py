"""Single Gemini call that analyzes both voice authenticity AND scam patterns.

Implements smart model cascading -- tries higher-tier models first,
falls through to cheaper ones when quota is exhausted.
"""

import base64
import json
import logging
import re

from config import settings

logger = logging.getLogger("aural.gemini")

# Models in priority order: best first, cheapest last.
# Each has separate daily quota on the free tier.
_MODEL_CASCADE = [
    "gemini-2.5-flash",       # Best quality, 20 req/day free
    "gemini-2.5-flash-lite",  # Good quality, separate quota
    "gemini-2.0-flash",       # Fast, 1500 req/day free
    "gemini-2.0-flash-lite",  # Fastest, 1500 req/day free
]

_COMBINED_PROMPT = """You are an expert audio forensics and scam detection system. Analyze this audio clip for TWO things simultaneously:

1. VOICE AUTHENTICITY: Is this AI-generated speech (TTS, deepfake, voice cloning like ElevenLabs, Bark, XTTS) or natural human speech? Consider prosody, breathing, micro-pauses, pitch variation, background consistency.

2. SCAM PATTERN ANALYSIS: Transcribe and analyze the speech content for social-engineering patterns.

Return ONLY valid JSON matching this exact schema:
{
  "synthetic_probability": <float 0-1: probability voice is AI-generated>,
  "voice_reasoning": "<one sentence on voice authenticity, max 20 words>",
  "transcript": "<full transcription of the audio>",
  "urgency": <float 0-1: pressure to act immediately>,
  "financial_request": <float 0-1: any request for money, gift cards, crypto, wire transfer>,
  "impersonation": <float 0-1: caller claims to be a specific family member, authority, or business>,
  "secrecy_pressure": <float 0-1: asking to keep call private>,
  "authority_threat": <float 0-1: legal/police/IRS/arrest/deportation threats>,
  "claimed_identity": <string or null: who they claim to be>,
  "trigger_phrases": [<exact phrases from audio that indicate scam, max 5>],
  "scam_verdict": <"trusted" | "suspicious" | "high_risk_scam">,
  "reasoning_brief": "<one sentence on scam analysis, max 25 words>"
}

Scoring rules:
- Voice: only score synthetic_probability >0.7 when audio clearly sounds artificial
- Scam: conservative by default. Only score >0.7 when language is unambiguous
- "high_risk_scam" requires at least 2 scam categories above 0.7 OR financial_request above 0.85
- If speech is just greeting/small talk, return scam scores as all zeros and scam_verdict "trusted"

Output JSON only."""


class GeminiAnalyzer:
    """Combined audio analysis with automatic model cascading.

    Tries models from best to cheapest. When one hits quota (429),
    it's marked as exhausted and the next model is tried automatically.
    Exhausted models are retried after a cooldown period.
    """

    def __init__(self) -> None:
        self._api_key = settings.gemini_api_key
        # Track which models are temporarily exhausted
        self._exhausted: dict[str, float] = {}
        self._cooldown = 65.0  # seconds before retrying an exhausted model

    @property
    def available(self) -> bool:
        return bool(self._api_key)

    def _is_available(self, model: str) -> bool:
        import time
        exhausted_at = self._exhausted.get(model)
        if exhausted_at is None:
            return True
        if time.time() - exhausted_at > self._cooldown:
            del self._exhausted[model]
            return True
        return False

    def _mark_exhausted(self, model: str) -> None:
        import time
        self._exhausted[model] = time.time()
        logger.info("Model %s marked exhausted, will retry in %ds", model, int(self._cooldown))

    def analyze_audio(self, audio_bytes: bytes, mime_type: str = "audio/wav") -> dict | None:
        """Analyze audio with automatic model cascading."""
        if not self._api_key:
            return None

        from google import genai

        client = genai.Client(api_key=self._api_key)
        contents = [
            {
                "inline_data": {
                    "mime_type": mime_type,
                    "data": base64.b64encode(audio_bytes).decode(),
                },
            },
            _COMBINED_PROMPT,
        ]

        for model in _MODEL_CASCADE:
            if not self._is_available(model):
                continue

            try:
                logger.info("Trying model: %s", model)
                resp = client.models.generate_content(
                    model=model,
                    contents=contents,
                    config={"temperature": 0.1, "response_mime_type": "application/json"},
                )

                raw = (resp.text or "").strip()
                cleaned = re.sub(r"^```(?:json)?\s*", "", raw)
                cleaned = re.sub(r"\s*```$", "", cleaned).strip()
                data = json.loads(cleaned)

                logger.info(
                    "Gemini [%s]: spoof=%.2f scam=%s transcript=%d chars",
                    model,
                    data.get("synthetic_probability", 0),
                    data.get("scam_verdict", "?"),
                    len(data.get("transcript", "")),
                )
                data["_model_used"] = model
                return data

            except Exception as exc:
                err = str(exc)
                if "429" in err or "RESOURCE_EXHAUSTED" in err:
                    self._mark_exhausted(model)
                    continue  # Try next model
                elif "400" in err and "MIME" in err:
                    # Unsupported mime type -- try with audio/wav fallback
                    logger.warning("MIME type %s rejected, skipping Gemini", mime_type)
                    return None
                else:
                    logger.warning("Gemini [%s] error: %s", model, err[:120])
                    return None

        logger.warning("All Gemini models exhausted")
        return None
