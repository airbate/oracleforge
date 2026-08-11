"""Tasks 4.1-4.2: Macro event calendar and BTC dominance tracker."""

import requests
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from typing import Optional
from loguru import logger


@dataclass
class MacroEvent:
    title: str
    impact: str          # "HIGH" | "MEDIUM" | "LOW"
    scheduled_at: datetime
    description: str = ""


# Static high-impact calendar — refreshed manually or via external API.
# Dates are kept rolling relative to the current month to remain useful in demos.
STATIC_EVENTS: list[MacroEvent] = []


def _rolling_events() -> list[MacroEvent]:
    """Generate macro events anchored to the current month so demos always have upcoming events."""
    now = datetime.now(tz=timezone.utc)
    # Anchor to first of current month
    base = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return [
        MacroEvent("FOMC Rate Decision", "HIGH", base + timedelta(days=14, hours=18, minutes=0)),
        MacroEvent("US CPI Release", "HIGH", base + timedelta(days=7, hours=12, minutes=30)),
        MacroEvent("US Non-Farm Payrolls", "HIGH", base + timedelta(days=21, hours=12, minutes=30)),
        MacroEvent("FOMC Meeting Minutes", "MEDIUM", base + timedelta(days=16, hours=18, minutes=0)),
        MacroEvent("US PPI Release", "MEDIUM", base + timedelta(days=9, hours=12, minutes=30)),
        MacroEvent("US Retail Sales", "MEDIUM", base + timedelta(days=11, hours=12, minutes=30)),
    ]


class MacroCalendar:
    """Task 4.1: Upcoming high-impact event detection with confidence penalty."""

    WARNING_HOURS = 24

    def upcoming_events(self, within_hours: int = 48) -> list[MacroEvent]:
        now = datetime.now(tz=timezone.utc)
        events = _rolling_events()
        return [
            e for e in events
            if 0 <= (e.scheduled_at - now).total_seconds() <= within_hours * 3600
        ]

    def confidence_multiplier(self) -> float:
        """Return confidence adjustment based on proximity to high-impact events."""
        events = self.upcoming_events(within_hours=2)   # within 2h → active window
        if events:
            return 0.8
        warning = self.upcoming_events(within_hours=self.WARNING_HOURS)
        if warning:
            return 0.9
        return 1.0

    def context_text(self) -> str:
        events = self.upcoming_events()
        if not events:
            return "No high-impact macro events in the next 48 hours."
        lines = [f"- {e.title} ({e.impact}) at {e.scheduled_at.strftime('%Y-%m-%d %H:%M UTC')}" for e in events]
        return "UPCOMING MACRO EVENTS:\n" + "\n".join(lines)


def fetch_btc_dominance() -> float:
    """Fetch BTC dominance from CoinGecko global data; returns 0.0 on failure."""
    try:
        r = requests.get("https://api.coingecko.com/api/v3/global", timeout=8)
        r.raise_for_status()
        data = r.json().get("data", {})
        return data.get("market_cap_percentage", {}).get("btc", 0.0)
    except Exception as e:
        logger.warning(f"MacroCalendar: failed to fetch BTC dominance ({e})")
        return 0.0
