import asyncio
import json
import re
from pathlib import Path

from openai import OpenAI

from config import settings
from core.schemas import ScamSignals


def _strip_json_fence(raw: str) -> str:
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return text.strip()


class ScamClassifier:
    def __init__(self) -> None:
        prompt_path = Path(__file__).resolve().parents[1] / "prompts" / "scam_classifier.txt"
        self._system = prompt_path.read_text(encoding="utf-8")

    async def classify(self, transcript_window: str) -> ScamSignals:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, lambda: self._classify_sync(transcript_window))

    def _classify_sync(self, transcript_window: str) -> ScamSignals:
        provider = settings.llm_provider.lower().strip()
        user_payload = transcript_window.strip() or "(empty transcript)"

        # Try Gemini first if key is available (smarter, faster)
        if settings.gemini_api_key and provider != "gemini":
            try:
                raw = self._gemini_complete(user_payload)
                return self._parse_signals(raw)
            except Exception:
                pass  # Fall through to configured provider

        if provider == "gemini":
            raw = self._gemini_complete(user_payload)
        elif provider == "featherless":
            fb = (settings.featherless_base_url or "").strip() or "https://api.featherless.ai/v1"
            raw = self._openai_compatible_complete(
                api_key=settings.featherless_api_key,
                base_url=fb,
                model=settings.featherless_model,
                user_payload=user_payload,
                json_mode=False,
            )
        else:
            bu = (settings.openai_base_url or "").strip() or "https://api.openai.com/v1"
            raw = self._openai_compatible_complete(
                api_key=settings.openai_api_key,
                base_url=bu,
                model=settings.openai_model,
                user_payload=user_payload,
            )
        return self._parse_signals(raw)

    def _openai_compatible_complete(
        self,
        *,
        api_key: str | None,
        base_url: str,
        model: str,
        user_payload: str,
        json_mode: bool = True,
    ) -> str:
        if not api_key:
            raise RuntimeError("Missing API key for selected LLM provider.")
        client = OpenAI(api_key=api_key, base_url=base_url)
        kwargs = dict(
            model=model,
            messages=[
                {"role": "system", "content": self._system},
                {"role": "user", "content": user_payload},
            ],
            temperature=0.1,
        )
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        resp = client.chat.completions.create(**kwargs)
        choice = resp.choices[0].message.content or "{}"
        return choice

    _GEMINI_CASCADE = [
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
    ]

    def _gemini_complete(self, user_payload: str) -> str:
        if not settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is not set.")
        from google import genai

        client = genai.Client(api_key=settings.gemini_api_key)
        contents = f"{self._system}\n\n---\n\nTranscript:\n{user_payload}"

        for model in self._GEMINI_CASCADE:
            try:
                resp = client.models.generate_content(
                    model=model,
                    contents=contents,
                    config={"temperature": 0.1, "response_mime_type": "application/json"},
                )
                return (resp.text or "").strip()
            except Exception as exc:
                if "429" in str(exc) or "RESOURCE_EXHAUSTED" in str(exc):
                    continue  # Try next model
                # Try without JSON mode
                try:
                    resp = client.models.generate_content(
                        model=model,
                        contents=contents,
                        config={"temperature": 0.1},
                    )
                    return (resp.text or "").strip()
                except Exception:
                    if "429" in str(exc):
                        continue
                    raise
        raise RuntimeError("All Gemini models exhausted")

    def _parse_signals(self, raw: str) -> ScamSignals:
        cleaned = _strip_json_fence(raw)
        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            return ScamSignals(reasoning_brief="Classifier returned non-JSON; treating as low risk.")
        try:
            return ScamSignals.model_validate(data)
        except Exception:
            return ScamSignals(reasoning_brief="Classifier JSON failed validation; treating as low risk.")
