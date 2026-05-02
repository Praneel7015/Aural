import asyncio
import sys
from pathlib import Path

import numpy as np
import torch

from config import settings


class AntiSpoofDetector:
    def __init__(self) -> None:
        self._model = None
        self._lock = asyncio.Lock()
        self._device = settings.antispoof_device

    def _ensure_vendor_path(self) -> Path:
        vendor = settings.backend_root / "vendor" / "AASIST3"
        if not vendor.is_dir():
            raise RuntimeError(
                f"AASIST3 vendor missing at {vendor}. Clone with: "
                "git clone https://github.com/lab260ru/AASIST3.git backend/vendor/AASIST3",
            )
        root_str = str(vendor.resolve())
        if root_str not in sys.path:
            sys.path.insert(0, root_str)
        return vendor

    async def load(self) -> None:
        async with self._lock:
            if self._model is not None:
                return
            self._ensure_vendor_path()
            from model import aasist3

            settings.wav2vec_cache_dir.mkdir(parents=True, exist_ok=True)

            loop = asyncio.get_event_loop()

            def _load():
                m = aasist3.from_pretrained(settings.antispoof_hub_id)
                m.eval()
                return m.to(self._device)

            self._model = await loop.run_in_executor(None, _load)

    @torch.no_grad()
    def _infer_sync(self, pcm_int16: np.ndarray) -> float:
        if self._model is None:
            raise RuntimeError("AntiSpoofDetector not loaded")
        x = torch.from_numpy(pcm_int16.astype(np.float32) / 32_768.0).unsqueeze(0)
        x = x.to(self._device)
        logits = self._model(x)
        probs = torch.softmax(logits, dim=-1)
        return float(probs[0, 1].item())

    async def detect(self, pcm_int16: np.ndarray) -> float:
        await self.load()
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, lambda: self._infer_sync(pcm_int16))
