import asyncio
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf

from config import settings


class StreamingTranscriber:
    def __init__(self) -> None:
        self._model = None
        self._lock = asyncio.Lock()
        self._accum = np.array([], dtype=np.int16)
        self._sr = settings.sample_rate

    async def load(self) -> None:
        async with self._lock:
            if self._model is not None:
                return
            from faster_whisper import WhisperModel

            loop = asyncio.get_event_loop()

            def _load():
                return WhisperModel(
                    settings.whisper_model,
                    device=settings.whisper_device,
                    compute_type=settings.whisper_compute_type,
                )

            self._model = await loop.run_in_executor(None, _load)

    def reset_accum(self) -> None:
        """Clear streaming buffer (call when starting a new WebSocket session)."""
        self._accum = np.array([], dtype=np.int16)

    def _transcribe_file_sync(self, path: str) -> str:
        assert self._model is not None
        kwargs = dict(
            beam_size=1,
            best_of=1,
            temperature=0,
            vad_filter=True,
            language="en",
            without_timestamps=True,
            condition_on_previous_text=False,
        )
        segments, _ = self._model.transcribe(path, **kwargs)
        parts = [s.text.strip() for s in segments if s.text]
        return " ".join(parts).strip()

    async def append_and_transcribe(self, pcm_chunk: np.ndarray | None) -> str:
        await self.load()
        if pcm_chunk is not None and len(pcm_chunk):
            self._accum = np.concatenate([self._accum, pcm_chunk.astype(np.int16)])
        max_keep = self._sr * 90
        if len(self._accum) > max_keep:
            self._accum = self._accum[-max_keep:]
        if len(self._accum) < self._sr // 4:
            return ""

        loop = asyncio.get_event_loop()

        def _run():
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                p = Path(tmp.name)
            try:
                sf.write(str(p), self._accum, self._sr, subtype="PCM_16")
                return self._transcribe_file_sync(str(p))
            finally:
                p.unlink(missing_ok=True)

        return await loop.run_in_executor(None, _run)

    async def transcribe_pcm16_full(self, pcm: np.ndarray) -> str:
        """Single-pass transcription for file uploads (does not use streaming accum)."""
        await self.load()
        if pcm.size == 0 or len(pcm) < self._sr // 4:
            return ""

        loop = asyncio.get_event_loop()

        def _run():
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                p = Path(tmp.name)
            try:
                sf.write(str(p), pcm.astype(np.int16), self._sr, subtype="PCM_16")
                return self._transcribe_file_sync(str(p))
            finally:
                p.unlink(missing_ok=True)

        return await loop.run_in_executor(None, _run)
