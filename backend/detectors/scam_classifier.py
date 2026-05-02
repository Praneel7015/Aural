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

    async def classify(
        self, transcript_window: str,
        openai_key: str | None = None,
        gemini_key: str | None = None,
        provider: str | None = None,
    ) -> ScamSignals:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, lambda: self._classify_sync(
            transcript_window, openai_key, gemini_key, provider
        ))

    def _classify_sync(
        self, transcript_window: str,
        openai_key: str | None = None,
        gemini_key: str | None = None,
        provider: str | None = None,
    ) -> ScamSignals:
        prov = (provider or settings.llm_provider).lower().strip()
        user_payload = transcript_window.strip() or "(empty transcript)"
        if prov == "gemini":
            raw = self._gemini_complete(user_payload, gemini_key)
        elif prov == "featherless":
            fb = (settings.featherless_base_url or "").strip() or "https://api.featherless.ai/v1"
            raw = self._openai_compatible_complete(
                api_key=openai_key or settings.featherless_api_key,
                base_url=fb,
                model=settings.featherless_model,
                user_payload=user_payload,
                json_mode=False,
            )
        else:
            bu = (settings.openai_base_url or "").strip() or "https://api.openai.com/v1"
            raw = self._openai_compatible_complete(
                api_key=openai_key or settings.openai_api_key,
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

    def _gemini_complete(self, user_payload: str, gemini_key: str | None = None) -> str:
        key = gemini_key or settings.gemini_api_key
        if not key:
            raise RuntimeError("GEMINI_API_KEY is not set.")
        import google.generativeai as genai

        genai.configure(api_key=key)
        model = genai.GenerativeModel(
            model_name=settings.gemini_model,
            system_instruction=self._system,
        )
        cfg = {"temperature": 0.1}
        try:
            cfg["response_mime_type"] = "application/json"
            resp = model.generate_content(user_payload, generation_config=cfg)
        except TypeError:
            cfg.pop("response_mime_type", None)
            resp = model.generate_content(user_payload, generation_config=cfg)
        try:
            text = (resp.text or "").strip()
        except ValueError:
            text = "{}"
        return text

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
