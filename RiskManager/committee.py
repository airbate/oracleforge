"""
Risk Committee: 3 agents (conservative / moderate / aggressive) vote on a signal.
Majority (2/3) required for approval. Final size = average of YES voters.
Inspired by TradingAgents' multi-agent risk management team.
"""
from __future__ import annotations

import json
from openai import OpenAI
from loguru import logger

_PROFILES: dict[str, str] = {
    "conservative": (
        "You are a conservative risk manager. Capital preservation is paramount. "
        "Vote YES only if confidence > 0.75 and consensus is HIGH_CONSENSUS. "
        "Cap position at 50% of the requested size."
    ),
    "moderate": (
        "You are a moderate risk manager. Balance risk and reward. "
        "Vote YES if confidence > 0.60. Keep requested position size."
    ),
    "aggressive": (
        "You are an aggressive risk manager. Maximize returns. "
        "Vote YES if confidence > 0.45. Allow up to 120% of requested size."
    ),
}

_VOTE_PROMPT = """\
Signal: {direction} | Asset: {asset} | Confidence: {confidence:.2f}
Requested position: ${size:.0f} | Consensus: {consensus}
Reasoning: {reasoning}

Vote YES or NO. Return ONLY valid JSON (no markdown):
{{"vote":"YES"|"NO","position_usd":float,"reason":"one sentence"}}"""


class RiskCommittee:
    def __init__(self, llm: OpenAI, model: str = "gpt-4o-mini"):
        self._llm = llm
        self._model = model

    def _vote(self, profile: str, system: str, prompt: str) -> dict:
        try:
            resp = self._llm.chat.completions.create(
                model=self._model,
                messages=[{"role": "system", "content": system}, {"role": "user", "content": prompt}],
                temperature=0.1,
                response_format={"type": "json_object"},
            )
            return json.loads(resp.choices[0].message.content)
        except Exception as e:
            logger.warning(f"RiskCommittee [{profile}] vote failed: {e}")
            return {"vote": "NO", "position_usd": 0.0, "reason": "error"}

    def evaluate(self, decision: dict, requested_size_usd: float) -> tuple[bool, float, str]:
        """
        Returns (approved, final_size_usd, summary).
        decision: dict from DebateEngine.run() with keys direction/confidence/reasoning/consensus/asset.
        """
        prompt = _VOTE_PROMPT.format(
            direction=decision.get("direction", "NEUTRAL"),
            asset=decision.get("asset", "?"),
            confidence=float(decision.get("confidence", 0.0)),
            size=requested_size_usd,
            consensus=decision.get("consensus", ""),
            reasoning=decision.get("reasoning", ""),
        )

        votes = {p: self._vote(p, sys, prompt) for p, sys in _PROFILES.items()}
        for p, v in votes.items():
            logger.info(f"RiskCommittee [{p}]: {v.get('vote')} @ ${v.get('position_usd', 0):.0f} — {v.get('reason','')}")

        yes_votes = [v for v in votes.values() if v.get("vote") == "YES"]
        approved = len(yes_votes) >= 2

        summary = " | ".join(f"{p}:{v['vote']}" for p, v in votes.items())
        if approved:
            avg_size = sum(v.get("position_usd", 0.0) for v in yes_votes) / len(yes_votes)
            return True, round(avg_size, 2), f"Approved (majority). {summary}"
        return False, 0.0, f"Rejected (majority). {summary}"
