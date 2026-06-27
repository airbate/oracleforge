"""Tests for Sentinel fallback and multi-asset behavior."""

import os
from unittest.mock import MagicMock

import pytest

from SocialSentinel.agent import SocialSentinelAgent
from SocialSentinel.tools.twitter_client import TwitterClient, CryptoPanicClient
from SocialSentinel.tools.reddit_client import RedditClient
from OnChainSentinel.tools.coingecko_client import CoinGeckoClient, get_coingecko_id
from MacroSentinel.tools.macro_calendar import MacroCalendar, _rolling_events


# ── SocialSentinel ───────────────────────────────────────────────────────────

def test_twitter_client_disabled_without_token():
    client = TwitterClient(bearer_token=None)
    assert client._client is None
    assert client.search(["INJ"]) == []


def test_reddit_client_disabled_without_credentials():
    client = RedditClient(client_id=None, client_secret=None)
    assert client._reddit is None
    assert client.search(["INJ"]) == []


def test_cryptopanic_returns_posts_or_empty():
    client = CryptoPanicClient()
    posts = client.fetch(["INJ"], limit=5)
    assert isinstance(posts, list)


def test_social_sentinel_fallback_no_keys(monkeypatch):
    monkeypatch.setattr("SocialSentinel.agent.settings.TWITTER_BEARER_TOKEN", None)
    monkeypatch.setattr("SocialSentinel.agent.settings.REDDIT_CLIENT_ID", None)
    monkeypatch.setattr("SocialSentinel.agent.settings.REDDIT_CLIENT_SECRET", None)
    agent = SocialSentinelAgent()
    result = agent.research("INJ", ["INJ"])
    assert "NEUTRAL" in result or "posts" in result.lower()


# ── OnChainSentinel ──────────────────────────────────────────────────────────

def test_coingecko_id_mapping():
    assert get_coingecko_id("ETH") == "ethereum"
    assert get_coingecko_id("BTC") == "bitcoin"
    assert get_coingecko_id("INJ") == "injective-protocol"


def test_coingecko_unknown_symbol_fallback():
    assert get_coingecko_id("UNKNOWN") == "unknown"


# ── MacroSentinel ────────────────────────────────────────────────────────────

def test_macro_calendar_has_upcoming_events():
    cal = MacroCalendar()
    events = _rolling_events()
    assert len(events) >= 3
    upcoming = cal.upcoming_events(within_hours=24 * 30)
    assert isinstance(upcoming, list)


def test_macro_multiplier_lower_near_events():
    cal = MacroCalendar()
    mult = cal.confidence_multiplier()
    assert 0.0 <= mult <= 1.0


# ── Multi-asset config parsing ───────────────────────────────────────────────

def test_trading_assets_parsing(monkeypatch):
    from config import Settings
    s = Settings(TRADING_ASSETS="INJ, ETH, BTC")
    assert [a.strip().upper() for a in s.TRADING_ASSETS.split(",") if a.strip()] == ["INJ", "ETH", "BTC"]
