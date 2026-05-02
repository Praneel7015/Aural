import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.report import router as report_router
from api.upload import router as upload_router
from api.vault_routes import router as vault_router
from api.ws_stream import router as ws_router
from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verity")

app = FastAPI(title="Verity", version="0.1.0")

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ws_router)
app.include_router(upload_router)
app.include_router(vault_router)
app.include_router(report_router)


@app.on_event("startup")
async def preload_models():
    """Preload all ML models on startup so first request is fast."""
    logger.info("Preloading models...")
    try:
        from deps import get_deps

        antispoof, speaker, transcriber, classifier, vault = get_deps()
        await antispoof.load()
        await transcriber.load()
        logger.info("Models preloaded successfully")
    except Exception as exc:
        logger.warning("Model preload failed (will lazy-load): %s", exc)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "verity"}


SUPPORTED_LANGUAGES = {
    "en": "English",
    "hi": "Hindi",
    "es": "Spanish",
    "ta": "Tamil",
    "fr": "French",
    "de": "German",
    "ja": "Japanese",
    "zh": "Chinese",
}


@app.get("/languages")
async def languages():
    return {"languages": SUPPORTED_LANGUAGES}


@app.post("/language/{lang}")
async def set_language(lang: str):
    if lang not in SUPPORTED_LANGUAGES and lang != "auto":
        return {"error": f"Unsupported language: {lang}"}
    from deps import get_deps
    _, _, transcriber, _, _ = get_deps()
    transcriber.set_language(None if lang == "auto" else lang)
    return {"language": lang, "name": SUPPORTED_LANGUAGES.get(lang, "Auto-detect")}


@app.get("/status")
async def status():
    """Report which models are loaded and ready."""
    from deps import _antispoof, _speaker, _transcriber, _classifier, _vault

    return {
        "service": "verity",
        "models": {
            "antispoof": {
                "loaded": _antispoof is not None and _antispoof._model is not None,
                "unavailable": _antispoof._unavailable if _antispoof else False,
            },
            "speaker_verify": {
                "loaded": _speaker is not None and _speaker._model is not None,
            },
            "transcriber": {
                "loaded": _transcriber is not None and _transcriber._model is not None,
            },
            "scam_classifier": {
                "loaded": _classifier is not None,
                "provider": settings.llm_provider,
            },
        },
        "vault": {
            "initialized": _vault is not None,
            "contacts": len(_vault.list_contacts()) if _vault else 0,
        },
    }
