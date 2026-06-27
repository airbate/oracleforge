"""Tests for utils/key_manager.py secure key storage."""

import os
import tempfile
from pathlib import Path

import pytest

from utils.key_manager import KeyManager, KeyManagerError


@pytest.fixture
def encrypted_file_backend():
    with tempfile.TemporaryDirectory() as tmp:
        key_path = Path(tmp) / "key.enc"
        password = "test-password-123"
        yield KeyManager(
            backend="encrypted_file",
            key_file_password=password,
            key_file_path=key_path,
        )


def test_encrypted_file_store_and_retrieve(encrypted_file_backend):
    key = "0x" + "ab" * 32
    encrypted_file_backend.store_private_key(key)
    assert encrypted_file_backend.get_private_key() == key


def test_encrypted_file_requires_password():
    km = KeyManager(backend="encrypted_file", key_file_password=None, key_file_path=Path("/tmp/x"))
    with pytest.raises(KeyManagerError):
        km.store_private_key("0xabc")


def test_encrypted_file_missing_file_raises():
    with tempfile.TemporaryDirectory() as tmp:
        km = KeyManager(
            backend="encrypted_file",
            key_file_password="pwd",
            key_file_path=Path(tmp) / "missing.enc",
        )
        with pytest.raises(KeyManagerError):
            km.get_private_key()


def test_encrypted_file_never_exposes_plaintext_in_repr(encrypted_file_backend):
    key = "0xdeadbeef"
    encrypted_file_backend.store_private_key(key)
    assert key not in repr(encrypted_file_backend)


def test_key_manager_backend_unknown():
    km = KeyManager(backend="unknown")
    with pytest.raises(KeyManagerError, match="Unknown key storage backend"):
        km.get_private_key()


@pytest.mark.skipif(os.environ.get("CI") == "true", reason="Keyring may require GUI unlock")
def test_keyring_backend_roundtrip():
    """Best-effort keyring test; skipped in headless CI."""
    km = KeyManager(backend="keyring")
    key = "0x" + "cd" * 32
    km.store_private_key(key)
    assert km.get_private_key() == key
    assert km.has_key() is True
