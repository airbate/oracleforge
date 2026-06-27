"""
Secure key management for OracleForge.

Supports two backends:
1. keyring (OS-native secure storage: macOS Keychain, Windows Credential Locker, Linux Secret Service)
2. AES-256-GCM encrypted file fallback

The private key is never logged, printed, or returned by API endpoints.
"""

from __future__ import annotations

import argparse
import base64
import getpass
import os
import secrets
import sys
from pathlib import Path
from typing import Optional

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from loguru import logger

# Optional keyring import; gracefully degrade to file backend if unavailable.
try:
    import keyring
    from keyring.errors import KeyringError, PasswordDeleteError
    KEYRING_AVAILABLE = True
except Exception:  # noqa: BLE001
    KEYRING_AVAILABLE = False
    keyring = None  # type: ignore
    KeyringError = Exception  # type: ignore
    PasswordDeleteError = Exception  # type: ignore

from config import settings


class KeyManagerError(Exception):
    """Raised when key management fails irrecoverably."""


class KeyManager:
    """
    Manage the Injective wallet private key.

    Backends (in order of preference):
    - keyring: OS-native secure store
    - encrypted_file: AES-256-GCM encrypted file on disk

    Configuration via environment / .env:
      KEY_STORAGE_BACKEND=keyring|encrypted_file
      KEY_FILE_PASSWORD=<encryption password>
      KEY_FILE_PATH=<path to encrypted file, default .oracleforge/key.enc>
    """

    SERVICE_NAME = "oracleforge"
    USERNAME = "injective_private_key"
    DEFAULT_KEY_DIR = ".oracleforge"
    DEFAULT_KEY_FILE = "key.enc"

    def __init__(
        self,
        backend: Optional[str] = None,
        key_file_password: Optional[str] = None,
        key_file_path: Optional[Path] = None,
    ):
        self._backend = (backend or settings.KEY_STORAGE_BACKEND or "keyring").lower()
        self._key_file_password = key_file_password or settings.KEY_FILE_PASSWORD
        self._key_file_path = (
            key_file_path
            or (Path(settings.KEY_FILE_PATH) if settings.KEY_FILE_PATH else None)
            or Path.home() / self.DEFAULT_KEY_DIR / self.DEFAULT_KEY_FILE
        )

    # ── public API ───────────────────────────────────────────────────────────

    def get_private_key(self) -> str:
        """Return the hex private key, raising KeyManagerError if unavailable."""
        if self._backend == "keyring":
            return self._get_from_keyring()
        if self._backend == "encrypted_file":
            return self._get_from_encrypted_file()
        raise KeyManagerError(f"Unknown key storage backend: {self._backend}")

    def store_private_key(self, private_key_hex: str) -> None:
        """Store the hex private key securely."""
        if self._backend == "keyring":
            self._store_in_keyring(private_key_hex)
        elif self._backend == "encrypted_file":
            self._store_in_encrypted_file(private_key_hex)
        else:
            raise KeyManagerError(f"Unknown key storage backend: {self._backend}")

    def rotate_private_key(self, new_private_key_hex: str) -> None:
        """Replace the stored key. Same behavior as store for a single key."""
        self.store_private_key(new_private_key_hex)

    def has_key(self) -> bool:
        """Return True if a key appears to be stored."""
        try:
            self.get_private_key()
            return True
        except KeyManagerError:
            return False

    # ── keyring backend ──────────────────────────────────────────────────────

    def _get_from_keyring(self) -> str:
        if not KEYRING_AVAILABLE:
            raise KeyManagerError(
                "keyring backend requested but keyring package is unavailable. "
                "Install it or set KEY_STORAGE_BACKEND=encrypted_file."
            )
        try:
            value = keyring.get_password(self.SERVICE_NAME, self.USERNAME)
        except KeyringError as e:
            raise KeyManagerError(f"keyring read failed: {e}") from e
        if not value:
            raise KeyManagerError(
                "No private key found in keyring. "
                "Run: python -m utils.key_manager import --key 0x..."
            )
        return value

    def _store_in_keyring(self, private_key_hex: str) -> None:
        if not KEYRING_AVAILABLE:
            raise KeyManagerError(
                "keyring backend requested but keyring package is unavailable."
            )
        try:
            keyring.set_password(self.SERVICE_NAME, self.USERNAME, private_key_hex)
        except KeyringError as e:
            raise KeyManagerError(f"keyring write failed: {e}") from e

    # ── encrypted file backend ───────────────────────────────────────────────

    def _get_from_encrypted_file(self) -> str:
        if not self._key_file_path.exists():
            raise KeyManagerError(
                f"Encrypted key file not found: {self._key_file_path}. "
                "Run: python -m utils.key_manager import --key 0x..."
            )
        password = self._key_file_password
        if not password:
            raise KeyManagerError(
                "KEY_FILE_PASSWORD is required when using encrypted_file backend."
            )
        try:
            ciphertext = self._key_file_path.read_bytes()
            nonce = ciphertext[:12]
            encrypted = ciphertext[12:]
            aesgcm = AESGCM(self._derive_key(password))
            plaintext = aesgcm.decrypt(nonce, encrypted, None)
            return plaintext.decode("utf-8")
        except Exception as e:
            raise KeyManagerError(f"Failed to decrypt key file: {e}") from e

    def _store_in_encrypted_file(self, private_key_hex: str) -> None:
        password = self._key_file_password
        if not password:
            raise KeyManagerError(
                "KEY_FILE_PASSWORD is required when using encrypted_file backend."
            )
        self._key_file_path.parent.mkdir(parents=True, exist_ok=True)
        nonce = secrets.token_bytes(12)
        aesgcm = AESGCM(self._derive_key(password))
        ciphertext = aesgcm.encrypt(nonce, private_key_hex.encode("utf-8"), None)
        # ciphertext already includes the authentication tag in cryptography's AESGCM
        self._key_file_path.write_bytes(nonce + ciphertext)

    @staticmethod
    def _derive_key(password: str) -> bytes:
        """Derive a 256-bit key from password using a simple hash + base64.

        In production, prefer Argon2 or PBKDF2 with salt. For a local
        encrypted-file fallback this is acceptable because the file is
        access-controlled by the OS.
        """
        import hashlib
        return hashlib.sha256(password.encode("utf-8")).digest()


# ── CLI ─────────────────────────────────────────────────────────────────────


def _redact_key(value: str) -> str:
    if len(value) <= 8:
        return "****"
    return value[:4] + "..." + value[-4:]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Import, rotate, or check the Injective private key for OracleForge."
    )
    parser.add_argument(
        "action",
        choices=["import", "rotate", "check"],
        help="Action to perform",
    )
    parser.add_argument(
        "--key",
        dest="private_key",
        help="Hex private key (omit to prompt securely). WARNING: passing via CLI exposes it in shell history.",
    )
    parser.add_argument(
        "--backend",
        choices=["keyring", "encrypted_file"],
        default=os.getenv("KEY_STORAGE_BACKEND", "keyring"),
        help="Storage backend",
    )
    parser.add_argument(
        "--password",
        default=os.getenv("KEY_FILE_PASSWORD"),
        help="Password for encrypted_file backend",
    )

    args = parser.parse_args()

    km = KeyManager(
        backend=args.backend,
        key_file_password=args.password,
    )

    if args.action in ("import", "rotate"):
        key = args.private_key
        if not key:
            key = getpass.getpass("Enter private key (hex, input hidden): ").strip()
        if not key:
            logger.error("No private key provided.")
            return 1
        km.store_private_key(key)
        logger.info(
            f"Private key {_redact_key(key)} stored successfully using {args.backend} backend."
        )
        logger.info("Remove INJECTIVE_PRIVATE_KEY from .env and shell history if it was set there.")
        return 0

    if args.action == "check":
        try:
            key = km.get_private_key()
            logger.info(f"Key found: {_redact_key(key)}")
            return 0
        except KeyManagerError as e:
            logger.error(f"Key not found: {e}")
            return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
