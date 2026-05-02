"""Shared heavyweight detectors — one instance per process for upload + WebSocket."""

from __future__ import annotations

import asyncio
import logging

from config import settings
from detectors.antispoof import AntiSpoofDetector
from detectors.scam_classifier import ScamClassifier
from detectors.speaker_verify import SpeakerVerifier
from detectors.transcriber import StreamingTranscriber
from vault.store import VoiceVault

logger = logging.getLogger("aural")

_antispoof: AntiSpoofDetector | None = None
_speaker: SpeakerVerifier | None = None
_transcriber: StreamingTranscriber | None = None
_classifier: ScamClassifier | None = None
_vault: VoiceVault | None = None


def get_pipeline_deps():
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


async def warmup_pipeline() -> None:
    """Pre-load models so the first request is not dominated by disk/network load."""
    antispoof, speaker, transcriber, _, _ = get_pipeline_deps()
    await asyncio.gather(
        transcriber.load(),
        antispoof.load(),
        speaker.load(),
    )
    logger.info("Pipeline models warmed (Whisper, anti-spoof, speaker).")
