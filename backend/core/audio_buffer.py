from dataclasses import dataclass

import numpy as np


@dataclass
class AudioChunkStats:
    sample_rate: int


class RollingWindowBuffer:
    def __init__(
        self,
        sample_rate: int = 16_000,
        window_samples: int = 64_600,
        stride_samples: int = 16_000,
    ):
        self.sample_rate = sample_rate
        self.window_samples = window_samples
        self.stride_samples = stride_samples
        self._pcm = np.array([], dtype=np.int16)
        self._emit_cursor = 0

    def push_pcm16(self, pcm_chunk: bytes) -> list[np.ndarray]:
        if not pcm_chunk:
            return []
        incoming = np.frombuffer(pcm_chunk, dtype=np.int16).copy()
        self._pcm = np.concatenate([self._pcm, incoming])

        max_keep = self.window_samples + self.stride_samples * 16
        if len(self._pcm) > max_keep:
            overflow = len(self._pcm) - max_keep
            self._pcm = self._pcm[overflow:]
            self._emit_cursor = max(0, self._emit_cursor - overflow)

        emitted: list[np.ndarray] = []
        while len(self._pcm) - self._emit_cursor >= self.window_samples:
            start = self._emit_cursor
            end = start + self.window_samples
            emitted.append(self._pcm[start:end].copy())
            self._emit_cursor += self.stride_samples

        trim_at = max(0, self._emit_cursor - self.window_samples)
        if trim_at > 0:
            self._pcm = self._pcm[trim_at:]
            self._emit_cursor -= trim_at

        return emitted
