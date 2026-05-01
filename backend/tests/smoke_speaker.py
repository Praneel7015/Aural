import asyncio
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


async def main():
    sr = 16000
    dur = 3
    t = np.linspace(0, dur, sr * dur, endpoint=False)
    a = (np.sin(2 * np.pi * 440 * t) * 0.3 * 32767).astype(np.int16)
    b = (np.sin(2 * np.pi * 880 * t) * 0.3 * 32767).astype(np.int16)
    from detectors.speaker_verify import SpeakerVerifier

    v = SpeakerVerifier()
    ea = await v.embed_pcm16(a)
    eb = await v.embed_pcm16(b)
    sim_diff = SpeakerVerifier.cosine(ea, eb)
    sim_same = SpeakerVerifier.cosine(ea, ea)
    assert sim_same > 0.99
    print("smoke_speaker ok:", "same", sim_same, "diff", sim_diff)


if __name__ == "__main__":
    asyncio.run(main())
