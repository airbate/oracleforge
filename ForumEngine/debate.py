"""
Real Bull/Bear adversarial debate — inspired by TradingAgents.
Sentinels give summaries → Bull & Bear argue 2 rounds → Trader synthesizes.
"""
from __future__ import annotations

import json
from openai import OpenAI
from loguru import logger

_BULL = "You are a Bull Researcher. Given market data, argue the strongest case for going LONG. Be specific, cite the data. 3-4 sentences."
_BEAR = "You are a Bear Researcher. Given market data, argue the strongest case for going SHORT or staying NEUTRAL. Be specific, cite the data. 3-4 sentences."
_REBUTTAL = "Opponent argued:\n{arg}\n\nRebut their strongest points using the data. 2-3 sentences."
_TRADER = """You are an experienced crypto Trader with memory of past trades.
{memory_block}
You just witnessed a Bull vs Bear debate. Synthesize both sides and return ONLY valid JSON (no markdown):
{{"direction":"LONG"|"SHORT"|"NEUTRAL","confidence":0.0-1.0,"reasoning":"...","consensus":"HIGH_CONSENSUS"|"CONFLICT"|"MIXED"}}
Factor past outcomes into confidence (e.g. repeated SL_HIT on LONG → lower confidence for LONG)."""


class DebateEngine:
    def __init__(self, llm: OpenAI, model: str = "gpt-4o-mini"):
        self._llm = llm
        self._model = model

    def _chat(self, system: str, msgs: list[dict], max_tokens: int = 300) -> str:
        resp = self._llm.chat.completions.create(
            model=self._model,
            messages=[{"role": "system", "content": system}] + msgs,
            temperature=0.3,
            max_tokens=max_tokens,
        )
        return resp.choices[0].message.content.strip()

    def run(self, social: str, onchain: str, macro: str, asset: str, memory: str = "") -> dict:
        """2-round Bull/Bear debate. Returns trader decision dict."""
        ctx = f"Asset: {asset}\n[SOCIAL] {social}\n[ONCHAIN] {onchain}\n[MACRO] {macro}"

        # Round 1: opening arguments
        bull1 = self._chat(_BULL, [{"role": "user", "content": ctx}])
        bear1 = self._chat(_BEAR, [{"role": "user", "content": ctx}])
        logger.info(f"[BULL R1] {bull1[:100]}…")
        logger.info(f"[BEAR R1] {bear1[:100]}…")

        # Round 2: rebuttals (each side sees the other's R1)
        bull2 = self._chat(_BULL, [
            {"role": "user", "content": ctx},
            {"role": "assistant", "content": bull1},
            {"role": "user", "content": _REBUTTAL.format(arg=bear1)},
        ])
        bear2 = self._chat(_BEAR, [
            {"role": "user", "content": ctx},
            {"role": "assistant", "content": bear1},
            {"role": "user", "content": _REBUTTAL.format(arg=bull1)},
        ])

        debate_log = (
            f"=== DEBATE: {asset} ===\n"
            f"[BULL] {bull1}\n[BEAR] {bear1}\n"
            f"[BULL rebuttal] {bull2}\n[BEAR rebuttal] {bear2}"
        )

        # Trader synthesizes the full debate (with optional memory context)
        memory_block = f"Past trades:\n{memory}\n" if memory else ""
        trader_system = _TRADER.format(memory_block=memory_block)
        try:
            raw = self._chat(trader_system, [{"role": "user", "content": debate_log}], max_tokens=200)
            result = json.loads(raw)
        except Exception as e:
            logger.warning(f"DebateEngine: trader parse failed ({e})")
            result = {"direction": "NEUTRAL", "confidence": 0.0, "reasoning": "parse error", "consensus": "CONFLICT"}

        result["asset"] = asset
        result["debate_log"] = debate_log
        return result
