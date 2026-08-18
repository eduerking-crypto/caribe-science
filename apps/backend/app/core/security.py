"""Password hashing (PBKDF2-HMAC-SHA256, OWASP) + JWT tokens. Sin dependencias pesadas."""
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt
from jwt import InvalidTokenError

from app.core.config import get_settings

settings = get_settings()


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, settings.password_hash_iterations)
    return f"pbkdf2_sha256${settings.password_hash_iterations}${salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algo, iterations, salt_hex, hash_hex = stored.split("$")
    except ValueError:
        return False
    if algo != "pbkdf2_sha256":
        return False
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), int(iterations))
    return hmac.compare_digest(dk.hex(), hash_hex)


def create_access_token(subject: str, extra: dict | None = None) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(subject),
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.secret_key, algorithms=["HS256"])


__all__ = ["hash_password", "verify_password", "create_access_token", "decode_token", "InvalidTokenError"]