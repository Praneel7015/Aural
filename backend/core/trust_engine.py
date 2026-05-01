import random
import time

from core.schemas import (
    DetectorAntiSpoof,
    DetectorScamPattern,
    DetectorVoiceMatch,
    ScamSignals,
    TrustState,
)

_CHALLENGE_BANK = [
    "Ask them what you ate for dinner last Sunday.",
    "Ask them what your childhood pet's name was.",
    "Tell them the agreed safe word — only the real person should know it.",
    "Ask them to name the street where you grew up.",
]


def _challenge_for_identity(claimed: str | None) -> str | None:
    if not claimed:
        return None
    base = random.choice(_CHALLENGE_BANK)
    who = claimed.strip() or "them"
    return f'Verify "{who}": {base}'


def scam_signals_to_pattern(scam: ScamSignals) -> DetectorScamPattern:
    return DetectorScamPattern(
        urgency=scam.urgency,
        financial_request=scam.financial_request,
        impersonation=scam.impersonation,
        secrecy_pressure=scam.secrecy_pressure,
        authority_threat=scam.authority_threat,
        trigger_phrases=list(scam.trigger_phrases or [])[:8],
    )


def compute_trust_state(
    *,
    antispoof: DetectorAntiSpoof,
    scam: ScamSignals,
    voice_match: DetectorVoiceMatch,
    transcript_partial: str,
    challenge_override: str | None = None,
) -> TrustState:
    score = 100.0
    reasons: list[str] = []

    if antispoof.spoof_prob > 0.5:
        penalty = (antispoof.spoof_prob - 0.5) * 100.0
        score -= penalty
        if antispoof.spoof_prob > 0.8:
            reasons.append("Voice appears synthetic (deepfake/TTS)")

    scam_max = max(
        scam.urgency,
        scam.financial_request,
        scam.impersonation,
        scam.secrecy_pressure,
        scam.authority_threat,
    )
    if scam_max > 0.5:
        score -= (scam_max - 0.5) * 90.0
        if scam.financial_request > 0.7:
            reasons.append("Money request detected")
        if scam.secrecy_pressure > 0.7:
            reasons.append("Pressure to keep call secret")
        if scam.authority_threat > 0.7:
            reasons.append("Authority/legal threats")

    if scam.impersonation > 0.6 and voice_match.claimed_identity:
        if voice_match.similarity < 0.4:
            score -= 40.0
            reasons.append(
                f"Voice does not match enrolled '{voice_match.claimed_identity}'",
            )

    score = max(0.0, min(100.0, score))

    if score >= 70:
        verdict = "trusted"
    elif score >= 40:
        verdict = "suspicious"
    else:
        verdict = "scam"

    pattern = scam_signals_to_pattern(scam)
    challenge = challenge_override
    if challenge is None and verdict != "trusted" and voice_match.claimed_identity:
        challenge = _challenge_for_identity(voice_match.claimed_identity)

    trust = int(round(score))
    return TrustState(
        timestamp=time.time(),
        trust_score=trust,
        verdict=verdict,
        detectors={
            "antispoof": antispoof.model_dump(),
            "scam_pattern": pattern.model_dump(),
            "voice_match": voice_match.model_dump(),
        },
        transcript_partial=transcript_partial,
        reasons=reasons,
        challenge_suggestion=challenge,
    )
