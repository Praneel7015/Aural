# Aural

> Real-time AI scam-call shield. Detects voice deepfakes, social-engineering language, and impersonated callers — all at once, in under two seconds, on a laptop.

---

## What this project is

Aural analyzes a live phone-call audio stream (or uploaded recording) and produces a real-time **Trust Score** by fusing three independent signals:

1. **Synthetic voice detection** — is this a deepfake / TTS / voice clone? (audio anti-spoofing model)
2. **Social-engineering analysis** — does the conversation contain known scam patterns? (LLM analyzes streaming transcript)
3. **Voice-print verification** — if the caller claims to be a known contact, does the voice match a stored embedding? (speaker verification against the user's "Family Voice Vault")

The output is a single 0–100 Trust Score with three drill-down meters and live red-flag highlighting on the transcript. The user sees, in real time, exactly why a call is being flagged.

**Target user:** anyone receiving phone calls — but the killer use case is protecting elderly parents from "grandchild in trouble" voice-clone scams, which stole over a billion dollars from families globally in 2025.

**This is a hackathon build.** Optimize for: (a) demo wow-factor, (b) clear architectural integrity, (c) zero model training. Every ML component is a pretrained downloadable artifact.

---

## The demo we are building toward

A judge sits at the demo table. Within 4 minutes, they see:

1. **The hook (30s):** Speaker plays a 10-second audio clip — *"Mom, please, I've been arrested, I need ten thousand rupees right now, don't tell dad."* Audience can't tell if it's real. Reveal: it's an ElevenLabs clone of a teammate's voice.
2. **The system in action (90s):** Replay the same audio. The dashboard lights up live: transcript appears word-by-word with "arrested" / "ten thousand" / "don't tell dad" highlighted red. Deepfake meter spikes to ~94%. Voice-print meter shows ~23% match against the enrolled "son" voice in the Family Voice Vault. Trust Score gauge swings from green to red, lands on **6/100 — SCAM**.
3. **The depth (90s):** Demo the Family Voice Vault enrollment flow. Show the Challenge Question feature ("Ask them what we ate last Sunday"). Show the post-call forensic export.
4. **The pitch (30s):** Hiya operates at the network. McAfee scans browsers. Pindrop protects banks. We protect the phone in your grandmother's hand.

Every line of code in this repo serves this demo.

---

## Tech stack — pinned and final

### Backend (Python 3.11)

| Layer | Choice | Version |
|---|---|---|
| Web framework | FastAPI + uvicorn | `fastapi==0.115.*`, `uvicorn[standard]==0.32.*` |
| ML runtime | PyTorch | `torch==2.4.*`, `torchaudio==2.4.*` |
| HF integration | transformers | `transformers==4.46.*` |
| Speaker verification | speechbrain | `speechbrain==1.0.*` |
| Streaming STT | whisperlivekit (uses faster-whisper) | `whisperlivekit` (latest) |
| Audio I/O | sounddevice + soundfile | `sounddevice==0.5.*`, `soundfile==0.12.*` |
| LLM client | anthropic (primary) or openai | `anthropic==0.39.*` |
| Storage | SQLite (stdlib) + numpy for vectors | `numpy==1.26.*` |
| Validation | pydantic | `pydantic==2.9.*` |
| Env | python-dotenv | `python-dotenv==1.0.*` |

### Frontend (TypeScript)

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js 15 (App Router) | `next@^15.0.0` |
| Language | TypeScript | `typescript@^5.6` |
| Styling | TailwindCSS | `tailwindcss@^3.4` |
| Components | shadcn/ui (Card, Button, Progress, Badge, Toast, Dialog) | latest |
| Charts | Recharts (RadialBarChart for gauges) | `recharts@^2.13` |
| Animation | Framer Motion | `framer-motion@^11` |
| State | Zustand | `zustand@^5.0` |
| Audio capture | Web Audio API + MediaRecorder | browser-native |
| Real-time | Native WebSocket | browser-native |
| Icons | lucide-react | latest |

### Models — every one is a pretrained download

| Role | Model | Source | Notes |
|---|---|---|---|
| Synthetic voice detection (PRIMARY) | AASIST3 | `huggingface.co/lab260/AASIST3` | Single-file, plug-and-play, ~1M params, CPU-friendly |
| Synthetic voice detection (UPGRADE PATH) | XLSR-SLS | `github.com/QiShanZhang/SLSforASVspoof-2021-DF` + `facebook/wav2vec2-xls-r-300m` on HF | Best accuracy on Speech DF Arena leaderboard but heavier setup; swap in if time permits |
| Speaker verification | ECAPA-TDNN | `speechbrain/spkrec-ecapa-voxceleb` on HF | 192-dim embeddings, `verify_files()` one-liner |
| Streaming transcription | Whisper distil-large-v3 | via `whisperlivekit` | Sub-second latency on CPU; falls back to `small.en` on weak hardware |
| Conversational red-flag detection | Claude Haiku 4.5 | Anthropic API (`claude-haiku-4-5-20251001`) | Structured JSON output, fast, cheap |
| TTS for demo voice cloning | ElevenLabs (free tier) | `elevenlabs.io` | Generate scam audio from teammate's 30-second voice sample |

### DevOps

- **Backend hosting:** local laptop + ngrok for the demo (no cloud headaches)
- **Frontend hosting:** Vercel (one-click GitHub deploy) or also local
- **Repo:** GitHub with clean README, demo video, architecture diagram

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│         AUDIO INPUT (mic stream or .wav upload)          │
│                  16 kHz, mono, PCM-16                    │
└────────────────────────────┬─────────────────────────────┘
                             │
                ┌────────────▼────────────┐
                │   Audio Buffer Manager  │
                │  (rolling 4s windows,   │
                │   1s stride, VAD-gated) │
                └────────────┬────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌────────────────┐  ┌─────────────────┐  ┌────────────────┐
│   LAYER 1      │  │    LAYER 2      │  │   LAYER 3      │
│   Anti-Spoof   │  │  Whisper STT +  │  │   Speaker      │
│   (AASIST3)    │  │  Claude Haiku   │  │  Verification  │
│                │  │  red-flag JSON  │  │ (ECAPA-TDNN)   │
│ → spoof_prob   │  │ → category      │  │ → cosine_sim   │
│   [0..1]       │  │   scores +      │  │   vs vault     │
│                │  │   trigger_phrases│  │   [-1..1]      │
└────────┬───────┘  └────────┬────────┘  └────────┬───────┘
         │                   │                    │
         └───────────────────┼────────────────────┘
                             ▼
              ┌──────────────────────────┐
              │      Trust Engine        │
              │  Weighted fusion + rules │
              │  → trust_score [0..100]  │
              │  → verdict: T/S/SCAM     │
              │  → reasons[]             │
              └────────────┬─────────────┘
                           │
                           ▼ WebSocket push
              ┌──────────────────────────┐
              │   Next.js Dashboard      │
              │  • Trust gauge           │
              │  • Three live meters     │
              │  • Highlighted transcript│
              │  • Verdict banner        │
              │  • Vault enrollment UI   │
              └──────────────────────────┘
```

---

## Project structure

```
aural/
├── README.md                          # this file
├── .env.example
├── .gitignore
│
├── backend/
│   ├── pyproject.toml
│   ├── requirements.txt
│   ├── main.py                        # FastAPI entrypoint
│   ├── config.py                      # env vars, model paths, thresholds
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── audio_buffer.py            # rolling window manager
│   │   ├── trust_engine.py            # fusion logic (the secret sauce)
│   │   └── schemas.py                 # pydantic models
│   │
│   ├── detectors/
│   │   ├── __init__.py
│   │   ├── antispoof.py               # AASIST3 wrapper
│   │   ├── speaker_verify.py          # ECAPA-TDNN wrapper
│   │   ├── transcriber.py             # WhisperLiveKit wrapper
│   │   └── scam_classifier.py         # Claude Haiku wrapper
│   │
│   ├── vault/
│   │   ├── __init__.py
│   │   ├── store.py                   # SQLite + .npy embeddings
│   │   └── enroll.py                  # enrollment flow
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── ws_stream.py               # WebSocket handler
│   │   ├── upload.py                  # file upload endpoint
│   │   └── vault_routes.py            # vault CRUD
│   │
│   ├── prompts/
│   │   └── scam_classifier.txt        # the LLM system prompt
│   │
│   └── tests/
│       ├── smoke_antispoof.py
│       ├── smoke_speaker.py
│       ├── smoke_transcribe.py
│       └── smoke_llm.py
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.mjs
│   │
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                   # main dashboard
│   │   ├── vault/page.tsx             # Family Voice Vault enrollment
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn components
│   │   ├── TrustGauge.tsx             # the big radial gauge
│   │   ├── DetectorMeter.tsx          # individual meter
│   │   ├── LiveTranscript.tsx         # transcript with red-flag highlighting
│   │   ├── VerdictBanner.tsx          # TRUSTED / SUSPICIOUS / SCAM
│   │   ├── VaultEnrollment.tsx        # record-and-enroll UI
│   │   └── ChallengeQuestion.tsx      # "ask them what dog's name is"
│   │
│   ├── lib/
│   │   ├── ws.ts                      # WebSocket client
│   │   ├── audio-capture.ts           # mic capture utilities
│   │   └── store.ts                   # zustand store
│   │
│   └── public/
│       └── demo-clips/                # pre-recorded fallback audio
│
├── models/                            # gitignored — downloaded checkpoints
│   ├── aasist3/
│   ├── ecapa_tdnn/                    # auto-downloaded by speechbrain
│   └── whisper/                       # auto-downloaded by whisperlivekit
│
└── demo/
    ├── pitch_deck.pdf
    ├── demo_video.mp4
    ├── architecture.png
    └── scenarios/
        ├── grandparent_scam_real.wav   # legit family-member call
        ├── grandparent_scam_clone.wav  # ElevenLabs clone of same teammate
        ├── irs_threat_clone.wav        # authority-impersonation scam
        └── bank_fraud_clone.wav        # bank-impersonation scam
```

---

## Setup instructions

### 1. Clone and install backend

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

`requirements.txt`:
```
fastapi==0.115.0
uvicorn[standard]==0.32.0
torch==2.4.1
torchaudio==2.4.1
transformers==4.46.0
speechbrain==1.0.2
whisperlivekit
sounddevice==0.5.1
soundfile==0.12.1
anthropic==0.39.0
pydantic==2.9.2
python-dotenv==1.0.1
numpy==1.26.4
```

### 2. Download AASIST3

```bash
mkdir -p models/aasist3
cd models/aasist3
# Download from HuggingFace
huggingface-cli download lab260/AASIST3 --local-dir .
cd ../..
```

If `huggingface-cli` is unavailable: `pip install huggingface_hub`.

### 3. ECAPA-TDNN auto-downloads on first use via SpeechBrain. No manual step.

### 4. Whisper distil-large-v3 auto-downloads via WhisperLiveKit on first run.

### 5. Set environment variables

`.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
WHISPER_MODEL=distil-large-v3        # use 'small.en' on weak hardware
ANTISPOOF_THRESHOLD=0.5
VOICEPRINT_MATCH_THRESHOLD=0.4
SCAM_VERDICT_THRESHOLD=0.7
```

### 6. Frontend

```bash
cd frontend
npm install
npx shadcn@latest init
npx shadcn@latest add card button progress badge dialog toast
npm run dev
```

### 7. Run

Terminal 1 (backend):
```bash
cd backend && source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

Terminal 2 (frontend):
```bash
cd frontend && npm run dev   # starts at :3000
```

Open `http://localhost:3000`.

---

## Implementation phases — build in this exact order

### Phase 1 — Backend skeleton + audio loop (hours 0–6)

Build the boring infrastructure first. **Do not touch ML yet.**

- `main.py`: FastAPI app with `/health`, `/ws/stream`, `/upload` endpoints
- `core/audio_buffer.py`: a class that accepts streaming PCM-16 chunks and emits 4-second windows with 1-second stride
- `api/ws_stream.py`: WebSocket handler that ingests browser audio chunks and writes to the buffer
- `core/schemas.py`: pydantic models for `DetectionUpdate`, `TrustState`, `VaultEntry`

**Acceptance:** open browser, click "start mic," and see `chunk_received` log lines in backend. No detection yet.

### Phase 2 — Three detectors as standalone modules (hours 6–18)

Each detector is a class with a single async method. Build and unit-test in isolation.

- `detectors/antispoof.py` — load AASIST3 once, expose `async detect(audio_4s) -> float`
- `detectors/speaker_verify.py` — load ECAPA-TDNN once, expose `async verify(audio_4s, vault_embedding) -> float`
- `detectors/transcriber.py` — wrap WhisperLiveKit, expose `async transcribe_chunk(audio) -> partial_transcript`
- `detectors/scam_classifier.py` — Claude API call with system prompt from `prompts/scam_classifier.txt`, expose `async classify(transcript_window: str) -> ScamSignals`

Run `tests/smoke_*.py` to confirm each works in isolation.

### Phase 3 — Trust Engine + WebSocket fusion (hours 18–26)

`core/trust_engine.py` is the secret sauce. It receives partial outputs from all three detectors and emits a unified `TrustState`. See "Trust Engine logic" section below for the exact rules.

The WebSocket handler runs all three detectors concurrently on each window and pipes results into the engine, then pushes `TrustState` updates to the frontend.

### Phase 4 — Frontend dashboard (hours 26–38)

Build top-down: layout first, then the four key components.

- `app/page.tsx` — single-page dashboard layout
- `components/TrustGauge.tsx` — Recharts `RadialBarChart`, big and central, animates color from green→amber→red
- `components/DetectorMeter.tsx` — three of these in a row showing the sub-signals
- `components/LiveTranscript.tsx` — appends transcript chunks; trigger phrases get `<mark>` styling with severity-based colors
- `components/VerdictBanner.tsx` — full-width banner: TRUSTED (green) / SUSPICIOUS (amber) / **SCAM** (red, pulsing)
- `app/vault/page.tsx` — record button → 30-second capture → enroll endpoint → list of enrolled contacts

### Phase 5 — Demo polish (hours 38–48)

- Pre-record all four scenarios in `demo/scenarios/` so the live demo can fall back to file playback if the mic flakes out
- Build pitch deck (5 slides max — see "Pitch script" section)
- Record a 90-second demo video as backup
- Clean README, architecture diagram, GitHub repo

---

## Key implementation contracts

### WebSocket message schema (backend → frontend)

Every 1 second, the backend pushes a `TrustState` message:

```typescript
type TrustState = {
  timestamp: number;
  trust_score: number;          // 0-100
  verdict: 'trusted' | 'suspicious' | 'scam';
  detectors: {
    antispoof: { spoof_prob: number; confidence: number };
    scam_pattern: {
      urgency: number;
      financial_request: number;
      impersonation: number;
      secrecy_pressure: number;
      authority_threat: number;
      trigger_phrases: string[];
    };
    voice_match: {
      best_match_contact: string | null;
      similarity: number;
      claimed_identity: string | null;
    };
  };
  transcript_partial: string;
  reasons: string[];            // human-readable explanation
  challenge_suggestion: string | null;  // "Ask them what your dog's name is"
};
```

### LLM system prompt — `prompts/scam_classifier.txt`

```
You are a real-time scam-call detection classifier. You analyze short transcript windows from a phone call and identify social-engineering patterns.

Return ONLY valid JSON matching this exact schema. No prose, no preamble:
{
  "urgency": <float 0-1: pressure to act immediately>,
  "financial_request": <float 0-1: any request for money, gift cards, crypto, wire transfer>,
  "impersonation": <float 0-1: caller claims to be a specific family member, authority, or business>,
  "secrecy_pressure": <float 0-1: asking to keep call private, "don't tell anyone">,
  "authority_threat": <float 0-1: legal/police/IRS/arrest/deportation threats>,
  "claimed_identity": <string or null: who they say they are, e.g. "son", "police officer", "bank">,
  "trigger_phrases": [<exact phrases from transcript that triggered detection, max 5>],
  "verdict": <"trusted" | "suspicious" | "high_risk_scam">,
  "reasoning_brief": <one sentence, max 25 words>
}

Known scam playbooks to recognize:
1. Grandparent scam: fake family member claims arrest/accident/emergency, urgent money request, secrecy from other family ("don't tell mom/dad")
2. IRS/police scam: authority threats, demands payment via wire / gift cards / crypto, threats of arrest or deportation
3. Tech support scam: claims virus/breach, requests remote access or payment for "fix"
4. Bank fraud: claims account compromise, asks victim to "move money to safe account"
5. Romance scam: emotional manipulation, isolation, gift/wire requests
6. Investment scam: guaranteed returns, time pressure, "act now"
7. Kidnapping/extortion: claims a loved one is in danger, immediate ransom

Scoring rules:
- Conservative by default. Only score >0.7 when language is unambiguous.
- "verdict": "high_risk_scam" requires at least 2 categories above 0.7 OR financial_request above 0.85
- If transcript is just greeting/small talk, return all zeros and verdict "trusted"

Output JSON only.
```

### Trust Engine logic — `core/trust_engine.py`

Pseudocode for the fusion:

```python
def compute_trust_state(antispoof, scam, voice_match) -> TrustState:
    # Start at 100 (full trust). Subtract for each red flag.
    score = 100.0
    reasons = []

    # Anti-spoof penalty: up to -50
    if antispoof.spoof_prob > 0.5:
        penalty = (antispoof.spoof_prob - 0.5) * 100  # 0.5→0, 1.0→50
        score -= penalty
        if antispoof.spoof_prob > 0.8:
            reasons.append("Voice appears synthetic (deepfake/TTS)")

    # Scam pattern penalty: up to -45
    scam_max = max(
        scam.urgency, scam.financial_request, scam.impersonation,
        scam.secrecy_pressure, scam.authority_threat,
    )
    if scam_max > 0.5:
        score -= (scam_max - 0.5) * 90
        if scam.financial_request > 0.7:
            reasons.append("Money request detected")
        if scam.secrecy_pressure > 0.7:
            reasons.append("Pressure to keep call secret")
        if scam.authority_threat > 0.7:
            reasons.append("Authority/legal threats")

    # Voice-print penalty: -40 if claimed identity but no match
    if scam.impersonation > 0.6 and voice_match.claimed_identity:
        if voice_match.similarity < 0.4:
            score -= 40
            reasons.append(
                f"Voice does not match enrolled '{voice_match.claimed_identity}'"
            )

    score = max(0, min(100, score))

    if score >= 70:
        verdict = "trusted"
    elif score >= 40:
        verdict = "suspicious"
    else:
        verdict = "scam"

    challenge = None
    if verdict != "trusted" and voice_match.claimed_identity:
        challenge = generate_challenge(voice_match.claimed_identity)

    return TrustState(
        trust_score=int(score),
        verdict=verdict,
        reasons=reasons,
        challenge_suggestion=challenge,
        ...
    )
```

### AASIST3 inference stub — `detectors/antispoof.py`

```python
import torch
import torchaudio
from pathlib import Path

class AntiSpoofDetector:
    def __init__(self, model_path: Path, device: str = "cpu"):
        # AASIST3 expects 4-second 16kHz mono input
        self.device = device
        self.model = torch.load(model_path / "model.pth", map_location=device)
        self.model.eval()
        self.target_sr = 16000
        self.target_len = 4 * self.target_sr  # 64000 samples

    @torch.no_grad()
    async def detect(self, audio: torch.Tensor, sr: int) -> float:
        # Resample if needed
        if sr != self.target_sr:
            audio = torchaudio.functional.resample(audio, sr, self.target_sr)
        # Pad or trim to 4s
        if audio.shape[-1] < self.target_len:
            audio = torch.nn.functional.pad(audio, (0, self.target_len - audio.shape[-1]))
        else:
            audio = audio[..., :self.target_len]

        audio = audio.unsqueeze(0).to(self.device)  # [1, 64000]
        logits = self.model(audio)
        # Output is [bonafide_score, spoof_score] — softmax and take spoof prob
        probs = torch.softmax(logits, dim=-1)
        return float(probs[0, 1].item())
```

> Note: exact loading code depends on the AASIST3 release format. Check the HF model card for the precise loader. If the released format is different (e.g., a config + state_dict pair), adapt accordingly. Have AASIST baseline (clovaai/aasist GitHub) as Plan B.

### ECAPA-TDNN — `detectors/speaker_verify.py`

```python
from speechbrain.inference.speaker import SpeakerRecognition
import torch

class SpeakerVerifier:
    def __init__(self):
        self.model = SpeakerRecognition.from_hparams(
            source="speechbrain/spkrec-ecapa-voxceleb",
            savedir="models/ecapa_tdnn",
            run_opts={"device": "cpu"},
        )

    def embed(self, audio_path: str) -> torch.Tensor:
        signal = self.model.load_audio(audio_path)
        embedding = self.model.encode_batch(signal.unsqueeze(0))
        return embedding.squeeze().detach().cpu()  # [192]

    def cosine(self, a: torch.Tensor, b: torch.Tensor) -> float:
        return float(torch.nn.functional.cosine_similarity(a, b, dim=0).item())
```

### Family Voice Vault — `vault/store.py`

```python
import sqlite3
import numpy as np
from pathlib import Path

class VoiceVault:
    def __init__(self, db_path: Path = Path("vault.db"), embedding_dir: Path = Path("vault/embeddings")):
        self.db = sqlite3.connect(db_path, check_same_thread=False)
        self.embedding_dir = embedding_dir
        self.embedding_dir.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    def _init_schema(self):
        self.db.execute("""
            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                relationship TEXT,
                embedding_path TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        self.db.commit()

    def enroll(self, name: str, relationship: str, embedding: np.ndarray) -> int:
        path = self.embedding_dir / f"{name.lower().replace(' ', '_')}.npy"
        np.save(path, embedding)
        cur = self.db.execute(
            "INSERT INTO contacts (name, relationship, embedding_path) VALUES (?, ?, ?)",
            (name, relationship, str(path))
        )
        self.db.commit()
        return cur.lastrowid

    def list_contacts(self) -> list[dict]:
        rows = self.db.execute("SELECT id, name, relationship FROM contacts").fetchall()
        return [{"id": r[0], "name": r[1], "relationship": r[2]} for r in rows]

    def best_match(self, query_embedding: np.ndarray) -> tuple[str | None, float]:
        """Return (contact_name, cosine_similarity) of closest enrolled voice."""
        best_name, best_score = None, -1.0
        for row in self.db.execute("SELECT name, embedding_path FROM contacts"):
            stored = np.load(row[1])
            sim = float(np.dot(stored, query_embedding) / (np.linalg.norm(stored) * np.linalg.norm(query_embedding)))
            if sim > best_score:
                best_score = sim
                best_name = row[0]
        return best_name, best_score
```

---

## Frontend key components

### `TrustGauge.tsx`

Recharts `RadialBarChart`, single bar, full ring background. Color interpolates: ≥70 green, 40–70 amber, <40 red. Animate via Framer Motion when value changes. Big — at least 320px diameter.

### `DetectorMeter.tsx`

Three of these in a horizontal row. Each is a card with:
- A title ("Synthetic Voice", "Scam Patterns", "Voice Match")
- A `Progress` bar showing 0–100
- A small status badge ("Clean" / "Warning" / "Alert")
- A subtle pulse animation when value spikes

### `LiveTranscript.tsx`

A scrolling region where transcript chunks append. Words in `trigger_phrases[]` get wrapped in `<mark>` with severity-based color: amber for moderate triggers, red for high. New chunks fade in. Auto-scroll to bottom unless user is hovering.

### `VerdictBanner.tsx`

Full-width banner pinned to top of dashboard. Three states:
- **TRUSTED** — green, calm
- **SUSPICIOUS — verify before acting** — amber, gentle pulse
- **SCAM DETECTED — DO NOT SEND MONEY** — red, strong pulse, larger font

### `VaultEnrollment.tsx`

Page at `/vault`. Big record button, 30-second countdown, name input, relationship dropdown ("son", "daughter", "mother", "spouse", "friend", "other"). Submit posts to `/api/vault/enroll`. Below: list of enrolled contacts with delete buttons.

### `ChallengeQuestion.tsx`

When `challenge_suggestion` is non-null, show a yellow card: *"⚠ Verify identity. Suggested challenge:"* followed by the question. Includes an example bank of challenges:
- "Ask them what we ate for dinner last Sunday"
- "Ask them what your childhood pet's name was"
- "Tell them the agreed safe word"

---

## Smoke tests — run before integration

Each must pass independently before Phase 3.

1. **`tests/smoke_speaker.py`** — record two clips of your own voice, one of a teammate's. Assert same-speaker cosine >0.5, different-speaker <0.3.
2. **`tests/smoke_transcribe.py`** — pipe `demo/scenarios/grandparent_scam_real.wav` to WhisperLiveKit, assert correct transcription within 2s.
3. **`tests/smoke_llm.py`** — feed a known scam transcript ("This is your grandson, I've been arrested...") to Claude Haiku, assert `verdict == "high_risk_scam"`.
4. **`tests/smoke_antispoof.py`** — feed real audio + ElevenLabs-cloned audio of same speaker, assert cloned scores higher on `spoof_prob`.

If any of these fail, do not advance phases. Fix the failing component first.

---

## Demo scenarios — pre-record these

Generate and save in `demo/scenarios/`:

1. **`grandparent_scam_clone.wav`** (15s) — ElevenLabs clone of teammate Aarav saying: *"Mom, please, I've been arrested and I need ten thousand rupees right now. Don't tell dad. The police won't let me go until I pay this."* Expected: spoof high, scam patterns high, voice-match low (vs enrolled real Aarav). **Trust Score: ~5.**

2. **`grandparent_real.wav`** (15s) — Aarav's actual voice: *"Hey mom, just checking in, dinner was great last night, see you Sunday."* Expected: spoof low, scam patterns low, voice-match high. **Trust Score: ~95.**

3. **`irs_threat_clone.wav`** (15s) — generic cloned voice: *"This is the Income Tax Department. There is a warrant for your arrest. You must pay forty thousand rupees in gift cards immediately or face deportation."* Expected: spoof medium-high, authority-threat very high, financial-request very high. **Trust Score: ~10.**

4. **`bank_fraud_clone.wav`** (15s) — generic cloned voice: *"This is HDFC Bank fraud department. Your account has been compromised. Please immediately transfer your balance to this safe account number while we investigate."* Expected: financial-request very high, impersonation high. **Trust Score: ~15.**

Always have these as fallbacks. Live mic capture in a noisy hackathon venue is unreliable.

---

## Acceptance criteria — definition of done

The project is demo-ready when **all** of the following are true:

- [ ] All four smoke tests pass
- [ ] WebSocket pipeline streams a `TrustState` update every ≤1 second
- [ ] Dashboard renders trust score, three meters, transcript with highlights, and verdict banner — all updating live
- [ ] Family Voice Vault enrollment flow works end-to-end (record → store → list → match)
- [ ] All four demo scenarios produce the expected verdicts
- [ ] Trust Score gauge animates smoothly green→red within 3 seconds of a scam clip starting
- [ ] Project runs on a single laptop (CPU-only path verified)
- [ ] GitHub repo has README, architecture diagram, demo video, pitch deck
- [ ] Backup demo video recorded and embedded in submission

---

## Pitch script — 4 minutes total

**[0:00–0:30] The hook.** *"Last year, AI voice scams stole over a billion dollars from families globally. The most common scam: a fake call from a child or grandchild claiming to be in trouble, demanding money, swearing the parent to secrecy. The voice is real. The crime is invisible. Listen."* [Play `grandparent_scam_clone.wav` through laptop speakers.] *"That was a deepfake. My teammate's voice, cloned from a 30-second WhatsApp note. My mother could not have told the difference. Neither could yours."*

**[0:30–2:00] The system.** *"This is Aural."* [Open dashboard.] *"It listens to live calls and analyzes three things at once: is this a synthetic voice, does the conversation match a scam pattern, and does the speaker actually match the person they claim to be."* [Replay clip with mic feeding the dashboard. Trust gauge sweeps red. Trigger phrases highlight. Banner: SCAM DETECTED.] *"Three signals, one verdict, in under two seconds."*

**[2:00–3:00] The depth.** *"The killer feature is the Family Voice Vault."* [Open `/vault`.] *"You enroll a 30-second sample of your loved one's voice. From then on, any call claiming to be them is verified against that vault."* [Show match for real Aarav vs. mismatch for cloned Aarav.] *"And when a scam is detected, the system suggests a challenge question — something only the real person would know — to break the script cold."*

**[3:00–3:30] The moat.** *"Hiya operates at the network level — telecom integration, B2B-only. Pindrop protects banks. McAfee scans browsers. Nobody protects the actual phone in your grandmother's hand from a call cloning her grandson's voice. We do. Privacy-first, runs on her own device, with her own contacts in her own vault."*

**[3:30–4:00] Close.** *"The technology — voice deepfake detection, social-engineering analysis, speaker verification — already exists in research labs and enterprise products. Aural is the first to ship them together, for free, in the language of consumer protection. Thank you."*

---

## Stretch goals — only if hours 38+ have free time

In priority order:

1. **Forensic export** — encrypted .zip with full call recording, timestamped detector outputs, and a PDF forensic report. One-click "Report to NCRP / IC3."
2. **Anonymous threat intel** — when a deepfake is detected, hash the voice embedding and push to a shared registry; warn other users of similar attacks.
3. **WhatsApp/Telegram voice-note scanner** — drag-and-drop a saved audio note, get a verdict.
4. **Multi-language** — LLM is already multilingual, but verify Whisper handles Hindi/Tamil/Spanish well.
5. **Mobile shell** — wrap the frontend in a simple Capacitor or Expo app for a more realistic "phone protection" demo.

Do not start any stretch goal until acceptance criteria are 100% green.

---

## Anti-patterns — do not do these

- ❌ **Do not train any model.** This is hackathon-fatal. Every ML component is pretrained. If you find yourself writing a training loop, stop immediately.
- ❌ **Do not deploy to AWS/GCP.** Local + ngrok is faster and more reliable for demo day.
- ❌ **Do not over-engineer the WebSocket protocol.** One message type (`TrustState`) is enough. Fight the urge to add 12 message types.
- ❌ **Do not build a login system.** The Family Voice Vault is local SQLite. No accounts.
- ❌ **Do not skip pre-recording demo audio.** The mic will fail at the worst moment. Have files ready.
- ❌ **Do not clone non-consenting voices** (public figures, strangers). Only clone teammates with explicit permission. Document the consent in the README.
- ❌ **Do not pitch from architecture.** Pitch from stakes — the grandmother, the billion-dollar fraud, the cloned voice she can't distinguish.

---

## Submission checklist

- [ ] GitHub repo (public or private with judge access)
- [ ] README with setup steps anyone can follow
- [ ] Architecture diagram (PNG or SVG)
- [ ] 90-second demo video uploaded (YouTube unlisted is fine)
- [ ] Pitch deck PDF (5 slides max)
- [ ] Working prototype runnable on a single laptop
- [ ] All ML components clearly labeled with their pretrained sources
- [ ] Acknowledgments section listing every model and library

---

## License & ethics

This project is built for the Octoverse Student Hackathon. All voice cloning used in development and demos is performed only on consenting teammates' voices with documented permission. The Family Voice Vault is a local-only feature; no audio leaves the user's device. No real scam calls or victims' data are used in development.

---

**Now build.** Start with Phase 1. Do not touch ML until WebSocket audio flow works end-to-end. Pre-record the demo scenarios on Day 1. Run the smoke tests early and often. Ship.
