import asyncio
import logging
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf

from config import settings

logger = logging.getLogger("aural.transcriber")


class StreamingTranscriber:
    def __init__(self) -> None:
        self._model = None
        self._lock = asyncio.Lock()
        self._sr = settings.sample_rate
        self._transcript_parts: list[str] = []
        self._language: str | None = "en"

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
            logger.info("Whisper model loaded: %s", settings.whisper_model)

    def _transcribe_file_sync(self, path: str) -> str:
        assert self._model is not None
        segments, _ = self._model.transcribe(
            path,
            beam_size=1,
            vad_filter=True,
            language=self._language,
        )
        parts = [s.text.strip() for s in segments if s.text]
        return " ".join(parts).strip()

    def set_language(self, lang: str | None) -> None:
        """Set transcription language (None = auto-detect)."""
        self._language = lang

    async def append_and_transcribe(self, pcm_chunk: np.ndarray | None) -> str:
        """Transcribe only the current window and append to running transcript."""
        await self.load()

        if pcm_chunk is None or len(pcm_chunk) < self._sr // 4:
            return " ".join(self._transcript_parts)

        loop = asyncio.get_event_loop()

        def _run():
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                p = Path(tmp.name)
            try:
                sf.write(str(p), pcm_chunk.astype(np.int16), self._sr, subtype="PCM_16")
                return self._transcribe_file_sync(str(p))
            finally:
                p.unlink(missing_ok=True)

        chunk_text = await loop.run_in_executor(None, _run)

        if chunk_text:
            self._transcript_parts.append(chunk_text)
            # Keep last ~60 parts to avoid unbounded growth
            if len(self._transcript_parts) > 60:
                self._transcript_parts = self._transcript_parts[-60:]

        return " ".join(self._transcript_parts)

    def reset(self) -> None:
        self._transcript_parts.clear()
