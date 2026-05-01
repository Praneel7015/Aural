import asyncio
import json
from io import BytesIO
from typing import Tuple

import numpy as np
import soundfile as sf
from fastapi import APIRouter, File, HTTPException, UploadFile

from config import settings
from core.audio_buffer import RollingWindowBuffer
from core.schemas import DetectorAntiSpoof, DetectorVoiceMatch, ScamSignals
from core.trust_engine import compute_trust_state
from detectors.antispoof import AntiSpoofDetector
from detectors.scam_classifier import ScamClassifier
from detectors.speaker_verify import SpeakerVerifier
from detectors.transcriber import StreamingTranscriber
from vault.store import VoiceVault

router = APIRouter(tags=["upload"])


def _read_mono_pcm_wav(raw: bytes) -> Tuple[np.ndarray, int]:
    pcm, sr = sf.read(BytesIO(raw), dtype="int16", always_2d=False)
    if pcm.ndim > 1:
        pcm = pcm.mean(axis=1).astype(np.int16)
    return pcm, int(sr)

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


@router.post("/upload")
async def upload_wav(file: UploadFile = File(...)):
    raw = await file.read()
    pcm, sr = _read_mono_pcm_wav(raw)
    if sr != settings.sample_rate:
        raise HTTPException(
            status_code=400,
            detail=f"Expected PCM WAV at {settings.sample_rate} Hz mono; got {sr}",
        )

    antispoof, speaker, transcriber, classifier, vault = _deps()
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

    last_state = None
    await transcriber.load()

    for w in windows:
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
        last_state = compute_trust_state(
            antispoof=anti,
            scam=scam,
            voice_match=voice,
            transcript_partial=transcript,
        )

    if last_state is None:
        try:
            empty_scam = await classifier.classify("")
        except Exception:
            empty_scam = ScamSignals(reasoning_brief="Classifier unavailable")
        last_state = compute_trust_state(
            antispoof=DetectorAntiSpoof(spoof_prob=0.0),
            scam=empty_scam,
            voice_match=DetectorVoiceMatch(),
            transcript_partial="",
        )

    return json.loads(last_state.model_dump_json())
