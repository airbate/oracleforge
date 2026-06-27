"""Tests for utils/auth.py API key middleware."""

import pytest
from flask import Flask, jsonify

from utils.auth import register_auth_middleware, SENSITIVE_ENDPOINTS


@pytest.fixture
def app_with_auth(monkeypatch):
    app = Flask(__name__)
    app.config["SECRET_KEY"] = "test-secret"

    @app.route("/api/signals")
    def signals():
        return jsonify([{"id": 1}])

    @app.route("/api/system/start", methods=["POST"])
    def start():
        return jsonify({"success": True})

    @app.route("/api/signals/<signal_id>/result", methods=["POST"])
    def result(signal_id):
        return jsonify({"success": True})

    register_auth_middleware(app)
    return app


@pytest.fixture
def client_no_auth(app_with_auth):
    """No ADMIN_API_KEY configured: all requests pass through."""
    app_with_auth.config["ADMIN_API_KEY"] = None
    with app_with_auth.test_client() as c:
        yield c


@pytest.fixture
def client_protected(app_with_auth, monkeypatch):
    """ADMIN_API_KEY set; public read disabled."""
    monkeypatch.setattr("utils.auth.settings.ADMIN_API_KEY", "secret-key")
    monkeypatch.setattr("utils.auth.settings.PUBLIC_READ_ACCESS", False)
    with app_with_auth.test_client() as c:
        yield c


@pytest.fixture
def client_public_read(app_with_auth, monkeypatch):
    """ADMIN_API_KEY set; public read enabled."""
    monkeypatch.setattr("utils.auth.settings.ADMIN_API_KEY", "secret-key")
    monkeypatch.setattr("utils.auth.settings.PUBLIC_READ_ACCESS", True)
    with app_with_auth.test_client() as c:
        yield c


def test_sensitive_endpoints_set():
    assert "POST /api/system/start" in SENSITIVE_ENDPOINTS


def test_no_auth_configured_all_pass(client_no_auth):
    assert client_no_auth.get("/api/signals").status_code == 200
    assert client_no_auth.post("/api/system/start").status_code == 200


def test_protected_read_requires_key(client_protected):
    assert client_protected.get("/api/signals").status_code == 401


def test_protected_read_with_valid_key(client_protected):
    r = client_protected.get("/api/signals", headers={"X-API-Key": "secret-key"})
    assert r.status_code == 200


def test_protected_sensitive_requires_key(client_protected):
    r = client_protected.post("/api/system/start")
    assert r.status_code == 401


def test_protected_sensitive_with_valid_key(client_protected):
    r = client_protected.post("/api/system/start", headers={"X-API-Key": "secret-key"})
    assert r.status_code == 200


def test_protected_dynamic_id_requires_key(client_protected):
    r = client_protected.post("/api/signals/uuid-123/result")
    assert r.status_code == 401


def test_public_read_allows_get(client_public_read):
    assert client_public_read.get("/api/signals").status_code == 200


def test_public_read_still_blocks_sensitive(client_public_read):
    r = client_public_read.post("/api/system/start")
    assert r.status_code == 401
    r2 = client_public_read.post("/api/system/start", headers={"X-API-Key": "secret-key"})
    assert r2.status_code == 200


def test_invalid_key_rejected(client_protected):
    r = client_protected.get("/api/signals", headers={"X-API-Key": "wrong"})
    assert r.status_code == 401
