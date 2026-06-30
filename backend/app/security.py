import hashlib
import os
import secrets


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120_000)
    return f"pbkdf2:{salt}:{digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    if not stored_hash:
        return False
    if stored_hash.startswith("pbkdf2:"):
        try:
            _, salt, digest_hex = stored_hash.split(":", 2)
            digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120_000)
            return secrets.compare_digest(digest.hex(), digest_hex)
        except ValueError:
            return False
    # Legacy plain-text passwords (migrate on successful login)
    return secrets.compare_digest(password, stored_hash)
