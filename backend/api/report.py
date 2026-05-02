"""Forensic report generation endpoint."""

import json
from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

from core.schemas import TrustState

router = APIRouter(tags=["report"])


class ReportRequest(BaseModel):
    trust_state: dict
    source: str = "unknown"


@router.post("/api/report/generate")
async def generate_report(req: ReportRequest):
    """Accept a TrustState and return a structured forensic report."""
    ts = req.trust_state
    now = datetime.now(tz=timezone.utc)

    report = {
        "report_id": f"AURAL-{int(now.timestamp())}",
        "generated_at": now.isoformat(),
        "source": req.source,
        "summary": {
            "trust_score": ts.get("trust_score", 100),
            "verdict": ts.get("verdict", "trusted"),
            "reasons": ts.get("reasons", []),
        },
        "detectors": ts.get("detectors", {}),
        "transcript": ts.get("transcript_partial", ""),
        "challenge_suggestion": ts.get("challenge_suggestion"),
        "metadata": {
            "analyzer_version": "0.1.0",
            "engine": "aural-trust-engine",
        },
    }

    return report
