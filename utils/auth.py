"""
API authentication middleware for OracleForge.

Protects sensitive /api/* endpoints when ADMIN_API_KEY is configured.
Public read access can be enabled with PUBLIC_READ_ACCESS=true.
"""

from __future__ import annotations

import functools
from typing import Callable

from flask import request, jsonify
from loguru import logger

from config import settings


SENSITIVE_ENDPOINTS = {
    "POST /api/system/start",
    "POST /api/system/stop",
    "POST /api/mcp",
    # /api/signals/<id>/result is matched by prefix below
}
SENSITIVE_PREFIXES = [
    ("POST", "/api/signals/"),
    ("POST", "/api/system/"),  # covers start/stop and any future system actions
]


def _is_sensitive_request() -> bool:
    """Return True if the current request hits a protected endpoint."""
    method = request.method
    path = request.path

    # Exact match
    if f"{method} {path}" in SENSITIVE_ENDPOINTS:
        return True

    # Prefix match (catches dynamic IDs like /api/signals/uuid/result)
    for m, prefix in SENSITIVE_PREFIXES:
        if method == m and path.startswith(prefix):
            return True

    return False


def _get_admin_api_key() -> str | None:
    key = settings.ADMIN_API_KEY
    if key is None:
        return None
    return str(key).strip()


def _provided_api_key() -> str | None:
    """Read API key from X-API-Key header or x-api-key query param."""
    key = request.headers.get("X-API-Key") or request.args.get("x-api-key")
    if key:
        return key.strip()
    return None


def api_key_required(view_func: Callable) -> Callable:
    """Decorator to force API key auth on a specific route regardless of global policy."""

    @functools.wraps(view_func)
    def wrapper(*args, **kwargs):
        admin_key = _get_admin_api_key()
        if admin_key is None:
            # If no admin key is configured, allow through (development mode)
            return view_func(*args, **kwargs)
        provided = _provided_api_key()
        if provided != admin_key:
            logger.warning(f"API key rejected for {request.method} {request.path}")
            return jsonify({"error": "Unauthorized"}), 401
        return view_func(*args, **kwargs)

    return wrapper


def register_auth_middleware(app) -> None:
    """Register a before_request handler that enforces API key policy."""

    @app.before_request
    def require_api_key():
        admin_key = _get_admin_api_key()

        # No admin key configured => no authentication enforced.
        if admin_key is None:
            return None

        provided = _provided_api_key()
        if provided == admin_key:
            return None

        # Sensitive endpoints always require the key.
        if _is_sensitive_request():
            logger.warning(f"API key rejected for {request.method} {request.path}")
            return jsonify({"error": "Unauthorized"}), 401

        # Public read access allows anonymous GET/HEAD on non-sensitive endpoints.
        if settings.PUBLIC_READ_ACCESS and request.method in ("GET", "HEAD"):
            return None

        # Everything else requires a valid key.
        logger.warning(f"API key rejected for {request.method} {request.path}")
        return jsonify({"error": "Unauthorized"}), 401


def is_authenticated() -> bool:
    """Return True if the current request is authenticated (or no key is set)."""
    admin_key = _get_admin_api_key()
    if admin_key is None:
        return True
    return _provided_api_key() == admin_key
