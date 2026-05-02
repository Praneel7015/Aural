"""Lightweight vault routes -- stores contacts but speaker verification requires local mode."""

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

router = APIRouter(prefix="/api/vault", tags=["vault"])

# In-memory contact store for light mode (no SQLite/numpy dependency needed)
_contacts: list[dict] = []
_next_id = 1


@router.get("/contacts")
async def list_contacts():
    return {"contacts": _contacts}


@router.post("/enroll")
async def enroll(
    name: Annotated[str, Form()],
    relationship: Annotated[str, Form()],
    audio: Annotated[UploadFile, File()],
):
    global _next_id
    if not name.strip():
        raise HTTPException(status_code=400, detail="Name required")
    # In light mode we store the contact but can't do voiceprint matching
    contact = {
        "id": _next_id,
        "name": name.strip(),
        "relationship": relationship.strip() or "other",
        "note": "Speaker verification requires local deployment mode",
    }
    _contacts.append(contact)
    _next_id += 1
    return contact


@router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: int):
    global _contacts
    before = len(_contacts)
    _contacts = [c for c in _contacts if c["id"] != contact_id]
    if len(_contacts) == before:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"ok": True}
