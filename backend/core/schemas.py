from pydantic import BaseModel, Field


class DetectorAntiSpoof(BaseModel):
    spoof_prob: float = Field(ge=0.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0, default=1.0)


class DetectorScamPattern(BaseModel):
    urgency: float = 0.0
    financial_request: float = 0.0
    impersonation: float = 0.0
    secrecy_pressure: float = 0.0
    authority_threat: float = 0.0
    trigger_phrases: list[str] = Field(default_factory=list)


class DetectorVoiceMatch(BaseModel):
    best_match_contact: str | None = None
    similarity: float = Field(ge=-1.0, le=1.0, default=-1.0)
    claimed_identity: str | None = None


class TrustState(BaseModel):
    timestamp: float
    trust_score: int = Field(ge=0, le=100)
    verdict: str
    detectors: dict = Field(default_factory=dict)
    transcript_partial: str = ""
    reasons: list[str] = Field(default_factory=list)
    challenge_suggestion: str | None = None


class ScamSignals(BaseModel):
    urgency: float = 0.0
    financial_request: float = 0.0
    impersonation: float = 0.0
    secrecy_pressure: float = 0.0
    authority_threat: float = 0.0
    claimed_identity: str | None = None
    trigger_phrases: list[str] = Field(default_factory=list)
    verdict: str = "trusted"
    reasoning_brief: str = ""
