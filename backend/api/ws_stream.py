import asyncio
import base64
import json

import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from config import settings
from core.audio_buffer import RollingWindowBuffer
from core.schemas import DetectorAntiSpoof, DetectorVoiceMatch, ScamSignals
from core.trust_engine import compute_trust_state
from pipeline import get_pipeline_deps

router = APIRouter(tags=["ws"])


async def _process_window(
    w: np.ndarray,
    antispoof,
    speaker,
    transcriber,
    classifier,
    vault,
    openai_key: str | None = None,
    gemini_key: str | None = None,
    provider: str | None = None,
):
    spoof_p, emb, transcript = await asyncio.gather(
        antispoof.detect(w),
        speaker.embed_pcm16(w),
        transcriber.append_and_transcribe(w),
    )
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
    return compute_trust_state(
        antispoof=anti,
        scam=scam,
        voice_match=voice,
        transcript_partial=transcript,
    )


@router.websocket("/ws/stream")
async def stream_ws(
    websocket: WebSocket,
    openai_key: str | None = None,
    gemini_key: str | None = None,
    provider: str | None = None,
):
    await websocket.accept()
    antispoof, speaker, transcriber, classifier, vault = get_pipeline_deps()
    buf = RollingWindowBuffer(
        sample_rate=settings.sample_rate,
        window_samples=settings.window_samples,
        stride_samples=settings.stride_samples,
    )
    await transcriber.load()
    transcriber.reset_accum()

    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            if msg.get("type") != "pcm16":
                continue
            b64 = msg.get("data") or ""
            pcm_chunk = base64.b64decode(b64)
            windows = buf.push_pcm16(pcm_chunk)
            for w in windows:
                state = await _process_window(
                    w,
                    antispoof,
                    speaker,
                    transcriber,
                    classifier,
                    vault,
                    openai_key=openai_key,
                    gemini_key=gemini_key,
                    provider=provider,
                )
                await websocket.send_text(state.model_dump_json())
    except WebSocketDisconnect:
        return
