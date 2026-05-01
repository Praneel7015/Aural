import asyncio
import base64
import json

import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from config import settings
from core.audio_buffer import RollingWindowBuffer
from core.schemas import DetectorAntiSpoof, DetectorVoiceMatch, ScamSignals
from core.trust_engine import compute_trust_state
from detectors.antispoof import AntiSpoofDetector
from detectors.scam_classifier import ScamClassifier
from detectors.speaker_verify import SpeakerVerifier
from detectors.transcriber import StreamingTranscriber
from vault.store import VoiceVault

router = APIRouter(tags=["ws"])

_antispoof: AntiSpoofDetector | None = None
_speaker: SpeakerVerifier | None = None
_transcriber: StreamingTranscriber | None = None
_classifier: ScamClassifier | None = None
_vault: VoiceVault | None = None


def _deps():
    global _antispoof, _speaker, _transcriber, _classifier, _vault
    if _vault is None:
        _vault = VoiceVault(settings.vault_db_path, settings.vault_embeddings_dir)
    if _antispoof is None:
        _antispoof = AntiSpoofDetector()
    if _speaker is None:
        _speaker = SpeakerVerifier()
    if _transcriber is None:
        _transcriber = StreamingTranscriber()
    if _classifier is None:
        _classifier = ScamClassifier()
    return _antispoof, _speaker, _transcriber, _classifier, _vault


async def _process_window(w: np.ndarray, antispoof, speaker, transcriber, classifier, vault):
    spoof_p, emb, transcript = await asyncio.gather(
        antispoof.detect(w),
        speaker.embed_pcm16(w),
        transcriber.append_and_transcribe(w),
    )
    best, sim = vault.best_match_tensor(emb)
    try:
        scam = await classifier.classify(transcript)
    except Exception:
        scam = ScamSignals(reasoning_brief="Classifier unavailable")
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
async def stream_ws(websocket: WebSocket):
    await websocket.accept()
    antispoof, speaker, transcriber, classifier, vault = _deps()
    buf = RollingWindowBuffer(
        sample_rate=settings.sample_rate,
        window_samples=settings.window_samples,
        stride_samples=settings.stride_samples,
    )
    await transcriber.load()

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
                state = await _process_window(w, antispoof, speaker, transcriber, classifier, vault)
                await websocket.send_text(state.model_dump_json())
    except WebSocketDisconnect:
        return
