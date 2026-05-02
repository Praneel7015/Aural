from io import BytesIO
from typing import Annotated

import numpy as np
import soundfile as sf
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from config import settings
from deps import get_deps
from detectors.speaker_verify import SpeakerVerifier
from vault.store import VoiceVault

router = APIRouter(prefix="/api/vault", tags=["vault"])


def get_vault() -> VoiceVault:
    _, _, _, _, vault = get_deps()
    return vault


def get_verifier() -> SpeakerVerifier:
    _, speaker, _, _, _ = get_deps()
    return speaker


@router.get("/contacts")
async def list_contacts(vault: Annotated[VoiceVault, Depends(get_vault)]):
    return {"contacts": vault.list_contacts()}


@router.post("/enroll")
async def enroll(
    name: Annotated[str, Form()],
    relationship: Annotated[str, Form()],
    audio: Annotated[UploadFile, File()],
    vault: Annotated[VoiceVault, Depends(get_vault)],
    verifier: Annotated[SpeakerVerifier, Depends(get_verifier)],
):
    if not name.strip():
        raise HTTPException(status_code=400, detail="Name required")
    raw = await audio.read()
    pcm, sr = sf.read(BytesIO(raw), dtype="int16", always_2d=False)
    if pcm.ndim > 1:
        pcm = pcm.mean(axis=1).astype(np.int16)
    if sr != settings.sample_rate:
        raise HTTPException(
            status_code=400,
            detail=f"Recording must be {settings.sample_rate} Hz mono WAV",
        )
    if len(pcm) < settings.sample_rate // 2:
        raise HTTPException(status_code=400, detail="Audio too short")
    emb = await verifier.embed_pcm16(pcm, sr)
    emb_np = emb.numpy().astype("float32")
    cid = vault.enroll(name.strip(), relationship.strip() or "other", emb_np)
    return {"id": cid, "name": name.strip(), "relationship": relationship}


@router.delete("/contacts/{contact_id}")
async def delete_contact(
    contact_id: int,
    vault: Annotated[VoiceVault, Depends(get_vault)],
):
    ok = vault.delete_contact(contact_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"ok": True}
