"""Lightweight entrypoint for hosted deployment.

Uses Gemini API for all ML tasks. No local PyTorch/SpeechBrain/Whisper needed.
RAM usage: ~100MB instead of 4GB.

Run with: uvicorn main_light:app --host 0.0.0.0 --port $PORT
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.upload_light import router as upload_router
from api.vault_routes_light import router as vault_router
from api.report import router as report_router
from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verity")

app = FastAPI(title="Verity", version="0.1.0")

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(vault_router)
app.include_router(report_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "verity", "mode": "light"}


@app.get("/status")
async def status():
    return {
        "service": "verity",
        "mode": "light",
        "models": {
            "gemini": {"available": bool(settings.gemini_api_key)},
            "featherless": {"available": bool(settings.featherless_api_key)},
            "local_models": "disabled (light mode)",
        },
    }


SUPPORTED_LANGUAGES = {
    "en": "English", "hi": "Hindi", "es": "Spanish", "ta": "Tamil",
    "fr": "French", "de": "German", "ja": "Japanese", "zh": "Chinese",
}


@app.get("/languages")
async def languages():
    return {"languages": SUPPORTED_LANGUAGES}
