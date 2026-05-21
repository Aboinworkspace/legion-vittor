from supabase import create_client, Client
from app.core.config import settings

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        _client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key
        )
    return _client


def get_supabase_anon() -> Client:
    """Use anon key for client-side auth operations."""
    return create_client(
        settings.supabase_url,
        settings.supabase_anon_key
    )
