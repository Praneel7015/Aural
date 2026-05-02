import asyncio
import base64
import json
import logging

import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from config import settings
from core.audio_buffer import RollingWindowBuffer
from core.schemas import DetectorAntiSpoof, DetectorVoiceMatch, ScamSignals
from core.trust_engine import compute_trust_state
from deps import get_deps

router = APIRouter(tags=["ws"])
logger = logging.getLogger("aural.ws")

# Only run scam classifier every N windows to reduce API calls
_CLASSIFY_EVERY = 3


async def _process_window(
    w: np.ndarray,
    window_idx: int,
    antispoof,
    speaker,
    transcriber,
    classifier,
    vault,
    prev_scam: ScamSignals | None,
):
    # Always run: deepfake detection + speaker embedding + transcription (in parallel)
    spoof_p, emb, transcript = await asyncio.gather(
        antispoof.detect(w),
        speaker.embed_pcm16(w),
        transcriber.append_and_transcribe(w),
    )

    best, sim = vault.best_match_tensor(emb)

    # Only run LLM classifier every N windows (saves API calls + latency)
    if window_idx % _CLASSIFY_EVERY == 0 or prev_scam is None:
        try:
            scam = await classifier.classify(transcript)
        except Exception:
            scam = prev_scam or ScamSignals(reasoning_brief="Classifier unavailable")
    else:
        scam = prev_scam or ScamSignals()

    voice = DetectorVoiceMatch(
        best_match_contact=best,
        similarity=sim,
        claimed_identity=scam.claimed_identity,
    )
    anti = DetectorAntiSpoof(spoof_prob=spoof_p, confidence=1.0)

    state = compute_trust_state(
        antispoof=anti,
        scam=scam,
        voice_match=voice,
        transcript_partial=transcript,
    )
    return state, scam


@router.websocket("/ws/stream")
async def stream_ws(websocket: WebSocket):
    await websocket.accept()
    antispoof, speaker, transcriber, classifier, vault = get_deps()

    # Reset transcriber for fresh session
    transcriber.reset()

    buf = RollingWindowBuffer(
        sample_rate=settings.sample_rate,
        window_samples=settings.window_samples,
        stride_samples=settings.stride_samples,
    )
    await transcriber.load()

    window_idx = 0
    prev_scam: ScamSignals | None = None

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
                state, prev_scam = await _process_window(
                    w, window_idx, antispoof, speaker, transcriber,
                    classifier, vault, prev_scam,
                )
                await websocket.send_text(state.model_dump_json())
                window_idx += 1
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected after %d windows", window_idx)
