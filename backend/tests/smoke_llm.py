import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


async def main():
    from detectors.scam_classifier import ScamClassifier

    if not os.getenv("OPENAI_API_KEY") and not os.getenv("GEMINI_API_KEY"):
        print("skip: set OPENAI_API_KEY or GEMINI_API_KEY and LLM_PROVIDER")
        return
    c = ScamClassifier()
    scam = await c.classify(
        "This is your grandson, I've been arrested and need ten thousand dollars wire transferred now. Don't tell mom.",
    )
    assert scam.verdict in ("high_risk_scam", "suspicious", "trusted")
    print("smoke_llm ok:", scam.model_dump())


if __name__ == "__main__":
    asyncio.run(main())
