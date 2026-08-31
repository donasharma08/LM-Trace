"""
Single-role auth: every authenticated user is an inspection officer.
Login happens client-side against Supabase Auth (see
frontend/src/lib/supabaseClient.js) -- this module verifies the
resulting JWT on protected backend routes.

Verifies against Supabase's JWKS endpoint (asymmetric ES256 signing
keys), not a static shared secret -- Supabase migrated new projects
to signing keys, and a hardcoded HS256 secret silently breaks the
moment a project is on the new scheme. PyJWKClient caches the
fetched public key and handles key rotation automatically.
"""

from __future__ import annotations

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

from app.config import get_settings

bearer_scheme = HTTPBearer()


class CurrentUser:
    def __init__(self, user_id: str, email: str):
        self.user_id = user_id
        self.email = email


def _jwks_url() -> str:
    settings = get_settings()
    return f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"


_jwk_client: PyJWKClient | None = None


def _get_jwk_client() -> PyJWKClient:
    global _jwk_client
    if _jwk_client is None:
        _jwk_client = PyJWKClient(_jwks_url())
    return _jwk_client


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> CurrentUser:
    token = credentials.credentials
    try:
        signing_key = _get_jwk_client().get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
        )
    except jwt.PyJWKClientError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not fetch signing key from Supabase -- check SUPABASE_URL",
        ) from exc
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
        ) from exc

    return CurrentUser(user_id=payload["sub"], email=payload.get("email", ""))
