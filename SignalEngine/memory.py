"""Fetch recent closed signals as a memory context string for the Trader agent."""
from __future__ import annotations

from .db import get_recent_signals

_OUTCOME_LABEL = {
    "TP_HIT": "✅ profit",
    "SL_HIT": "❌ loss",
    "EXPIRED": "⏱ expired",
    "EXEC_FAILED": "⚠ exec failed",
}


def get_trader_memory(asset: str, n: int = 5) -> str:
    """Return a formatted string of the last n closed signals for `asset`."""
    closed = [
        r for r in get_recent_signals(limit=50)
        if r["asset"] == asset and r["status"] in _OUTCOME_LABEL
    ][:n]

    if not closed:
        return ""

    lines = ["Recent trade outcomes (oldest → newest):"]
    for r in reversed(closed):
        label = _OUTCOME_LABEL[r["status"]]
        lines.append(
            f"  {r['created_at'][:16]}  {r['signal']}  conf={r['confidence']:.2f}"
            f"  [{r['consensus_tag'] or 'no-tag'}]  → {label}"
            f"  | {r['reasoning'][:80]}"
        )
    return "\n".join(lines)
