import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.upload import router as upload_router
from api.vault_routes import router as vault_router
from api.ws_stream import router as ws_router
from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aural")

app = FastAPI(title="Aural", version="0.1.0")

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


@app.get("/health")
async def health():
    return {"status": "ok", "service": "aural"}
