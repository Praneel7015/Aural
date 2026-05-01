import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


async def main():
    vendor = os.path.join(os.path.dirname(__file__), "..", "vendor", "AASIST3")
    if not os.path.isdir(vendor):
        print("skip: vendor/AASIST3 missing")
        return
    import numpy as np

    from detectors.antispoof import AntiSpoofDetector

    d = AntiSpoofDetector()
    rng = np.random.default_rng(0)
    noise = (rng.standard_normal(64600) * 8000).astype(np.int16)
    p = await d.detect(noise)
    assert 0.0 <= p <= 1.0
    print("smoke_antispoof ok:", p)


if __name__ == "__main__":
    asyncio.run(main())
