from functools import lru_cache

from supabase import Client, create_client

from app.config import get_settings


@lru_cache
def get_supabase() -> Client:
    settings = get_settings()
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        raise RuntimeError(
            "SUPABASE_URL / SUPABASE_SERVICE_KEY not set -- copy .env.example to .env "
            "and fill in your Supabase project credentials."
        )
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
