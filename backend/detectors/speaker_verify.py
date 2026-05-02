import asyncio
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
import torch

from config import settings


class SpeakerVerifier:
    def __init__(self) -> None:
        self._model = None
        self._lock = asyncio.Lock()

    async def load(self) -> None:
        async with self._lock:
            if self._model is not None:
                return
            from speechbrain.inference.speaker import SpeakerRecognition
            from speechbrain.utils.fetching import LocalStrategy

            loop = asyncio.get_event_loop()

            def _load():
                return SpeakerRecognition.from_hparams(
                    source="speechbrain/spkrec-ecapa-voxceleb",
                    # Keep savedir unset on Windows so SpeechBrain uses HF cache
                    # directly and does not attempt privileged symlinks.
                    savedir=None,
                    local_strategy=LocalStrategy.COPY,
                    run_opts={"device": "cpu"},
                )

            self._model = await loop.run_in_executor(None, _load)

    def _embed_path_sync(self, wav_path: str) -> torch.Tensor:
        assert self._model is not None
        # SpeechBrain's split_path() only splits on "/". Windows "\" paths are treated as a bare
        # filename under "./", yielding cwd + absolute path (broken). Use POSIX paths for load_audio.
        posix_path = Path(wav_path).resolve().as_posix()
        signal = self._model.load_audio(posix_path)
        embedding = self._model.encode_batch(signal.unsqueeze(0))
        return embedding.squeeze().detach().cpu()

    async def embed_pcm16(self, pcm: np.ndarray, sample_rate: int = 16_000) -> torch.Tensor:
        await self.load()
        loop = asyncio.get_event_loop()

        def _write_and_embed():
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                path = Path(tmp.name)
            try:
                sf.write(str(path), pcm.astype(np.int16), sample_rate, subtype="PCM_16")
                return self._embed_path_sync(str(path))
            finally:
                path.unlink(missing_ok=True)

        return await loop.run_in_executor(None, _write_and_embed)

    @staticmethod
    def cosine(a: torch.Tensor, b: torch.Tensor) -> float:
        return float(torch.nn.functional.cosine_similarity(a.unsqueeze(0), b.unsqueeze(0), dim=-1).item())
