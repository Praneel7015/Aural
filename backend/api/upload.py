import asyncio
import json
import logging
from io import BytesIO

import numpy as np
import soundfile as sf
import torch
import torchaudio
from fastapi import APIRouter, File, UploadFile

from config import settings
from core.audio_buffer import RollingWindowBuffer
from core.schemas import DetectorAntiSpoof, DetectorVoiceMatch, ScamSignals, TrustState
from core.trust_engine import compute_trust_state
from deps import get_deps
from detectors.gemini_analyzer import GeminiAnalyzer

router = APIRouter(tags=["upload"])
logger = logging.getLogger("aural.upload")

_gemini = GeminiAnalyzer()


def _read_mono_pcm(raw: bytes) -> tuple[np.ndarray, int]:
    pcm, sr = sf.read(BytesIO(raw), dtype="float32", always_2d=False)
    if pcm.ndim > 1:
        pcm = pcm.mean(axis=1)
    target_sr = settings.sample_rate
    if sr != target_sr:
        tensor = torch.from_numpy(pcm).unsqueeze(0)
        resampled = torchaudio.functional.resample(tensor, sr, target_sr)
        pcm = resampled.squeeze(0).numpy()
    pcm_int16 = (pcm * 32767).clip(-32768, 32767).astype(np.int16)
    return pcm_int16, target_sr


def _pick_windows(windows: list[np.ndarray], max_count: int = 5) -> list[np.ndarray]:
    """Select evenly spaced windows for efficient processing."""
    if len(windows) <= max_count:
        return windows
    n = len(windows)
    step = (n - 1) / (max_count - 1)
    indices = [round(i * step) for i in range(max_count)]
    return [windows[i] for i in indices]


@router.post("/upload")
async def upload_wav(file: UploadFile = File(...)):
    raw = await file.read()
    pcm, sr = _read_mono_pcm(raw)
    loop = asyncio.get_event_loop()

    antispoof, speaker, transcriber, classifier, vault = get_deps()

    # === PRIMARY PATH: Gemini combined analysis (1 API call) ===
    # Detect correct MIME type
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

    gemini_result = None
    if _gemini.available:
        gemini_result = await loop.run_in_executor(
            None,
            lambda: _gemini.analyze_audio(raw, mime_type=mime),
        )

    # Reset transcriber state for fresh upload
    transcriber.reset()

    # === SPEAKER VERIFICATION: Run on a single representative window ===
    mid_start = max(0, len(pcm) // 2 - settings.window_samples // 2)
    mid_end = mid_start + settings.window_samples
    if mid_end > len(pcm):
        rep_window = np.pad(pcm, (0, max(0, settings.window_samples - len(pcm))))
        rep_window = rep_window[: settings.window_samples]
    else:
        rep_window = pcm[mid_start:mid_end]

    emb = await speaker.embed_pcm16(rep_window)
    best_contact, sim = vault.best_match_tensor(emb)

    if gemini_result:
        # === GEMINI PATH: Use Gemini's analysis for everything ===
        gemini_spoof = float(gemini_result.get("synthetic_probability", 0.0))
        transcript = gemini_result.get("transcript", "")

        # Also run local deepfake models on one window for fusion
        local_spoof = await antispoof.detect(rep_window)
        peak_spoof = max(gemini_spoof, local_spoof)

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
            best_match_contact=best_contact,
            similarity=sim,
            claimed_identity=scam.claimed_identity,
        )
        anti = DetectorAntiSpoof(spoof_prob=peak_spoof, confidence=1.0)

        state = compute_trust_state(
            antispoof=anti,
            scam=scam,
            voice_match=voice,
            transcript_partial=transcript,
        )

        # Enrich with Gemini reasoning
        result = json.loads(state.model_dump_json())
        result["voice_reasoning"] = gemini_result.get("voice_reasoning")
        result["scam_reasoning"] = gemini_result.get("reasoning_brief")
        result["analysis_source"] = "gemini"

        logger.info(
            "Gemini path: score=%d verdict=%s spoof=%.1f%% (gemini=%.1f%% local=%.1f%%)",
            state.trust_score, state.verdict, peak_spoof * 100,
            gemini_spoof * 100, local_spoof * 100,
        )
        return result

    # === FALLBACK PATH: Local models only ===
    logger.info("Falling back to local-only analysis")

    roller = RollingWindowBuffer(
        sample_rate=settings.sample_rate,
        window_samples=settings.window_samples,
        stride_samples=settings.stride_samples,
    )
    pcm_bytes = pcm.astype(np.int16).tobytes()
    windows = roller.push_pcm16(pcm_bytes)
    if not windows:
        pad = settings.window_samples - len(pcm)
        if pad > 0:
            pcm = np.pad(pcm, (0, pad))
        windows = [pcm[: settings.window_samples]]

    # Process only 3 windows for speed
    windows = _pick_windows(windows)

    await transcriber.load()
    peak_spoof = 0.0
    transcript = ""

    for w in windows:
        spoof_p, _, chunk_text = await asyncio.gather(
            antispoof.detect(w),
            speaker.embed_pcm16(w),
            transcriber.append_and_transcribe(w),
        )
        peak_spoof = max(peak_spoof, spoof_p)
        transcript = chunk_text

    # Single scam classification on full transcript
    try:
        scam = await classifier.classify(transcript)
    except Exception:
        scam = ScamSignals(reasoning_brief="Classifier unavailable")

    voice = DetectorVoiceMatch(
        best_match_contact=best_contact,
        similarity=sim,
        claimed_identity=scam.claimed_identity,
    )
    anti = DetectorAntiSpoof(spoof_prob=peak_spoof, confidence=1.0)

    state = compute_trust_state(
        antispoof=anti,
        scam=scam,
        voice_match=voice,
        transcript_partial=transcript,
    )

    result = json.loads(state.model_dump_json())
    result["analysis_source"] = "local"
    result["scam_reasoning"] = scam.reasoning_brief

    logger.info(
        "Local path: score=%d verdict=%s spoof=%.1f%% windows=%d",
        state.trust_score, state.verdict, peak_spoof * 100, len(windows),
    )
    return result
