"""Lightweight upload endpoint -- uses only Gemini API, no local ML models.

For hosted deployment where PyTorch/SpeechBrain/Whisper aren't available.
Falls back to Featherless for scam classification if Gemini is exhausted.
"""

import asyncio
import json
import logging

from fastapi import APIRouter, File, UploadFile

from config import settings
from core.schemas import DetectorAntiSpoof, DetectorVoiceMatch, ScamSignals
from core.trust_engine import compute_trust_state
from detectors.gemini_analyzer import GeminiAnalyzer

router = APIRouter(tags=["upload"])
logger = logging.getLogger("verity.upload")

_gemini = GeminiAnalyzer()


def _fallback_classify_sync(transcript: str) -> ScamSignals:
    """Fallback to Featherless when Gemini is exhausted."""
    from detectors.scam_classifier import ScamClassifier

    c = ScamClassifier()
    return c._classify_sync(transcript)


@router.post("/upload")
async def upload_wav(file: UploadFile = File(...)):
    raw = await file.read()
    loop = asyncio.get_event_loop()

    # Detect MIME type
    fname = (file.filename or "").lower()
    if fname.endswith(".mp3"):
        mime = "audio/mp3"
    elif fname.endswith(".m4a"):
        mime = "audio/mp4"
    elif fname.endswith(".ogg"):
        mime = "audio/ogg"
    elif fname.endswith(".flac"):
        mime = "audio/flac"
    elif fname.endswith(".webm"):
        mime = "audio/webm"
    else:
        mime = "audio/wav"

    # Try Gemini combined analysis (1 API call does everything)
    gemini_result = None
    if _gemini.available:
        gemini_result = await loop.run_in_executor(
            None,
            lambda: _gemini.analyze_audio(raw, mime_type=mime),
        )

    if gemini_result:
        spoof_prob = float(gemini_result.get("synthetic_probability", 0.0))
        transcript = gemini_result.get("transcript", "")

        scam = ScamSignals(
            urgency=float(gemini_result.get("urgency", 0)),
            financial_request=float(gemini_result.get("financial_request", 0)),
            impersonation=float(gemini_result.get("impersonation", 0)),
            secrecy_pressure=float(gemini_result.get("secrecy_pressure", 0)),
            authority_threat=float(gemini_result.get("authority_threat", 0)),
            claimed_identity=gemini_result.get("claimed_identity"),
            trigger_phrases=gemini_result.get("trigger_phrases", [])[:5],
            verdict=gemini_result.get("scam_verdict", "trusted"),
            reasoning_brief=gemini_result.get("reasoning_brief", ""),
        )

        voice = DetectorVoiceMatch(
            best_match_contact=None,
            similarity=-1.0,
            claimed_identity=scam.claimed_identity,
        )
        anti = DetectorAntiSpoof(spoof_prob=spoof_prob, confidence=1.0)

        state = compute_trust_state(
            antispoof=anti,
            scam=scam,
            voice_match=voice,
            transcript_partial=transcript,
        )

        result = json.loads(state.model_dump_json())
        result["voice_reasoning"] = gemini_result.get("voice_reasoning")
        result["scam_reasoning"] = gemini_result.get("reasoning_brief")
        result["analysis_source"] = "gemini"
        result["_model_used"] = gemini_result.get("_model_used", "gemini")

        logger.info(
            "Gemini path: score=%d verdict=%s spoof=%.1f%%",
            state.trust_score, state.verdict, spoof_prob * 100,
        )
        return result

    # Fallback: use Featherless for scam classification (no deepfake detection)
    logger.info("Gemini unavailable, falling back to text-only analysis")

    # We can't do deepfake detection or transcription without Gemini/local models
    # Just do scam classification on filename as hint
    try:
        scam = await loop.run_in_executor(
            None,
            lambda: _fallback_classify_sync("(audio file uploaded, transcript unavailable)"),
        )
    except Exception:
        scam = ScamSignals(reasoning_brief="All analyzers unavailable")

    voice = DetectorVoiceMatch()
    anti = DetectorAntiSpoof(spoof_prob=0.0, confidence=0.0)

    state = compute_trust_state(
        antispoof=anti,
        scam=scam,
        voice_match=voice,
        transcript_partial="(transcription unavailable -- Gemini quota may be exhausted)",
    )

    result = json.loads(state.model_dump_json())
    result["analysis_source"] = "fallback"
    return result
