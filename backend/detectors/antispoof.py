import asyncio
import logging
import sys
from pathlib import Path

import numpy as np
import torch

from config import settings

logger = logging.getLogger("aural.antispoof")

_HF_MODEL_ID = "garystafford/wav2vec2-deepfake-voice-detector"


class AntiSpoofDetector:
    """Dual local-model deepfake detector.

    Layer 1: wav2vec2 fine-tuned on ElevenLabs + modern TTS (clean audio).
    Layer 2: AASIST3 for older TTS/voice conversion attacks.

    Gemini audio analysis is handled separately by GeminiAnalyzer.
    """

    def __init__(self) -> None:
        self._hf_model = None
        self._hf_fe = None
        self._aasist = None
        self._lock = asyncio.Lock()
        self._device = settings.antispoof_device
        self._hf_unavailable = False
        self._aasist_unavailable = False

    def _ensure_vendor_path(self) -> Path:
        vendor = settings.backend_root / "vendor" / "AASIST3"
        if not vendor.is_dir():
            raise FileNotFoundError(f"AASIST3 vendor missing at {vendor}.")
        root_str = str(vendor.resolve())
        if root_str not in sys.path:
            sys.path.insert(0, root_str)
        return vendor

    async def load(self) -> None:
        async with self._lock:
            if self._hf_model is None and not self._hf_unavailable:
                try:
                    from transformers import (
                        AutoFeatureExtractor,
                        AutoModelForAudioClassification,
                    )
                    loop = asyncio.get_event_loop()

                    def _load_hf():
                        fe = AutoFeatureExtractor.from_pretrained(_HF_MODEL_ID)
                        m = AutoModelForAudioClassification.from_pretrained(_HF_MODEL_ID)
                        m.eval()
                        return fe, m

                    self._hf_fe, self._hf_model = await loop.run_in_executor(None, _load_hf)
                    logger.info("HF deepfake detector loaded: %s", _HF_MODEL_ID)
                except Exception as exc:
                    self._hf_unavailable = True
                    logger.warning("HF deepfake model unavailable: %s", exc)

            if self._aasist is None and not self._aasist_unavailable:
                try:
                    self._ensure_vendor_path()
                    from model import aasist3
                    settings.wav2vec_cache_dir.mkdir(parents=True, exist_ok=True)
                    loop = asyncio.get_event_loop()

                    def _load_aasist():
                        m = aasist3.from_pretrained(settings.antispoof_hub_id)
                        m.eval()
                        return m.to(self._device)

                    self._aasist = await loop.run_in_executor(None, _load_aasist)
                    logger.info("AASIST3 loaded successfully")
                except Exception as exc:
                    self._aasist_unavailable = True
                    logger.warning("AASIST3 unavailable: %s", exc)

    @torch.no_grad()
    def _infer_sync(self, pcm_int16: np.ndarray) -> float:
        pcm_float = pcm_int16.astype(np.float32) / 32_768.0

        hf = 0.0
        if self._hf_model is not None and self._hf_fe is not None:
            try:
                inputs = self._hf_fe(
                    pcm_float, sampling_rate=16_000, return_tensors="pt", padding=True,
                )
                probs = torch.softmax(self._hf_model(**inputs).logits, dim=-1)
                hf = float(probs[0, 1].item())
            except Exception as exc:
                logger.warning("HF inference error: %s", exc)

        aasist = 0.0
        if self._aasist is not None:
            try:
                x = torch.from_numpy(pcm_float).unsqueeze(0).to(self._device)
                logits = self._aasist(x)
                probs = torch.softmax(logits, dim=-1)
                aasist = float(probs[0, 1].item())
            except Exception as exc:
                logger.warning("AASIST3 inference error: %s", exc)

        combined = max(hf, aasist)
        logger.info("Antispoof local: hf=%.3f aasist=%.3f -> %.3f", hf, aasist, combined)
        return combined

    async def detect(self, pcm_int16: np.ndarray) -> float:
        await self.load()
        if self._hf_unavailable and self._aasist_unavailable:
            return 0.0
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, lambda: self._infer_sync(pcm_int16))
