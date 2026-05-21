from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    app_name: str = "Legion Vittor Virtual Office"
    app_env: str = "development"
    secret_key: str = "change-me-in-production"

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # ── LLMs (all 3) ──────────────────────────────────────────────────
    anthropic_api_key: str = ""
    claude_model: str = "claude-sonnet-4-5"

    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    openai_image_model: str = "dall-e-3"
    openai_tts_model: str = "tts-1"
    openai_tts_voice: str = "alloy"  # alloy, echo, fable, onyx, nova, shimmer

    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-pro"

    # ── Free services ─────────────────────────────────────────────────
    resend_api_key: str = ""
    resend_from_email: str = "onboarding@resend.dev"

    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""

    meta_access_token: str = ""
    meta_instagram_account_id: str = ""

    youtube_api_key: str = ""
    youtube_client_id: str = ""
    youtube_client_secret: str = ""
    youtube_refresh_token: str = ""

    # CORS
    allowed_origins: List[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
