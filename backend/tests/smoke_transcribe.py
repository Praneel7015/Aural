import asyncio
import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


async def main():
    path = Path(__file__).resolve().parents[2] / "demo" / "scenarios" / "grandparent_scam_real.wav"
    if not path.is_file():
        print("skip: demo clip missing", path)
        return
    from detectors.transcriber import StreamingTranscriber

    t = StreamingTranscriber()
    import numpy as np
    import soundfile as sf

    pcm, sr = sf.read(path, dtype="int16", always_2d=False)
    if pcm.ndim > 1:
        pcm = pcm.mean(axis=1).astype(np.int16)
    text = await t.append_and_transcribe(pcm)
    assert isinstance(text, str)
    print("smoke_transcribe ok:", text[:120])


if __name__ == "__main__":
    asyncio.run(main())
