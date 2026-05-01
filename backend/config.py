from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    backend_root: Path = Field(default_factory=lambda: Path(__file__).resolve().parent)

    host: str = "0.0.0.0"
    port: int = 8000

    cors_origins: str = "http://localhost:3000"

    whisper_model: str = "distil-large-v3"
    whisper_device: str = "cpu"
    whisper_compute_type: str = "int8"

    antispoof_hub_id: str = "lab260/AASIST3"
    antispoof_device: str = "cpu"
    wav2vec_cache_dir: Path = Field(default_factory=lambda: Path(__file__).resolve().parent / "models" / "wav2vec_cache")

    llm_provider: str = Field(
        default="openai",
        description="openai | gemini | featherless",
    )
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    openai_base_url: str | None = Field(default=None, description="Optional OpenAI-compatible override.")

    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.0-flash"

    featherless_api_key: str | None = None
    featherless_base_url: str = "https://api.featherless.ai/v1"
    featherless_model: str = "meta-llama/Meta-Llama-3.1-8B-Instruct"

    antispoof_threshold: float = 0.5
    voiceprint_match_threshold: float = 0.4
    scam_verdict_threshold: float = 0.7

    vault_db_path: Path = Field(default_factory=lambda: Path(__file__).resolve().parent / "vault.db")
    vault_embeddings_dir: Path = Field(
        default_factory=lambda: Path(__file__).resolve().parent / "vault" / "embeddings",
    )

    ecapa_savedir: Path = Field(default_factory=lambda: Path(__file__).resolve().parent / "models" / "ecapa_tdnn")

    sample_rate: int = 16_000
    window_samples: int = 64_600
    stride_samples: int = 16_000


def get_settings() -> Settings:
    return Settings()


settings = get_settings()
