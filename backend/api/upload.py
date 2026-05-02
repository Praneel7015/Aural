import asyncio
import json
from io import BytesIO
from typing import Tuple

import numpy as np
import soundfile as sf
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from config import settings
from core.audio_buffer import RollingWindowBuffer
from core.schemas import DetectorAntiSpoof, DetectorVoiceMatch, ScamSignals
from core.trust_engine import compute_trust_state
from pipeline import get_pipeline_deps

router = APIRouter(tags=["upload"])


def _sample_windows_for_antispoof(windows: list[np.ndarray], max_n: int) -> list[np.ndarray]:
    if len(windows) <= max_n:
        return windows
    idxs = [round(i * (len(windows) - 1) / (max_n - 1)) for i in range(max_n)]
    out: list[np.ndarray] = []
    seen: set[int] = set()
    for i in idxs:
        if i not in seen:
            seen.add(i)
            out.append(windows[i])
    return out


def _read_mono_pcm_wav(raw: bytes) -> Tuple[np.ndarray, int]:
    pcm, sr = sf.read(BytesIO(raw), dtype="int16", always_2d=False)
    if pcm.ndim > 1:
        pcm = pcm.mean(axis=1).astype(np.int16)
    return pcm, int(sr)


@router.post("/upload")
async def upload_wav(
    file: UploadFile = File(...),
    openai_key: str | None = Form(None),
    gemini_key: str | None = Form(None),
    provider: str | None = Form(None),
):
    raw = await file.read()
    pcm, sr = _read_mono_pcm_wav(raw)
    if sr != settings.sample_rate:
        raise HTTPException(
            status_code=400,
            detail=f"Expected PCM WAV at {settings.sample_rate} Hz mono; got {sr}",
        )

    antispoof, speaker, transcriber, classifier, vault = get_pipeline_deps()

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

    spoof_windows = _sample_windows_for_antispoof(windows, settings.upload_antispoof_max_windows)

    await asyncio.gather(transcriber.load(), antispoof.load(), speaker.load())

    max_emb_samples = settings.sample_rate * settings.upload_embedding_max_seconds
    pcm_voice = pcm[-max_emb_samples:] if len(pcm) > max_emb_samples else pcm

    # One Whisper pass + parallel anti-spoof windows + one speaker embedding (not N× Whisper + N× LLM).
    transcript, spoof_probs, emb = await asyncio.gather(
        transcriber.transcribe_pcm16_full(pcm),
        asyncio.gather(*(antispoof.detect(w) for w in spoof_windows)),
        speaker.embed_pcm16(pcm_voice),
    )
    spoof_p = float(max(spoof_probs)) if spoof_probs else 0.0

    best, sim = vault.best_match_tensor(emb)
    try:
        scam = await classifier.classify(
            transcript, openai_key=openai_key, gemini_key=gemini_key, provider=provider
        )
    except Exception as e:
        scam = ScamSignals(reasoning_brief=f"Classifier unavailable: {str(e)}")
    voice = DetectorVoiceMatch(
        best_match_contact=best,
        similarity=sim,
        claimed_identity=scam.claimed_identity,
    )
    anti = DetectorAntiSpoof(spoof_prob=spoof_p, confidence=1.0)
    last_state = compute_trust_state(
        antispoof=anti,
        scam=scam,
        voice_match=voice,
        transcript_partial=transcript,
    )

    return json.loads(last_state.model_dump_json())
