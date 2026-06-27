"""
OracleForge — main Flask application.
Wires together: 3 Sentinels → ForumEngine → SignalEngine → RiskManager → InjectiveExecutor

Flask runs in API-only mode. The official UI is the Next.js frontend in web/.
"""

from __future__ import annotations

import os
import sys
import time
import concurrent.futures
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from loguru import logger
from openai import OpenAI

from config import settings
from ForumEngine.monitor import start_forum_monitoring, stop_forum_monitoring, get_forum_log
from ForumEngine.debate import DebateEngine
from SignalEngine.schema import TradingSignal, SignalStatus, Direction, Horizon
from SignalEngine.schema import aggregate_confidence, calc_sl_tp
from SignalEngine.db import save_signal, get_recent_signals, mark_signal_result, save_loop_error
from SignalEngine.memory import get_trader_memory
from RiskManager.risk_manager import RiskManager, RiskConfig
from RiskManager.committee import RiskCommittee
from InjectiveExecutor.executor import InjectiveExecutor
from InjectiveExecutor.mcp_interface import MCPInterface
from OnChainSentinel.tools.coingecko_client import CoinGeckoClient
from SocialSentinel.agent import SocialSentinelAgent
from OnChainSentinel.agent import OnChainSentinelAgent
from MacroSentinel.agent import MacroSentinelAgent
from utils.key_manager import KeyManager, KeyManagerError
from utils.auth import register_auth_middleware
from utils.signal_loop import SignalLoop, FatalLoopError, RecoverableLoopError, LoopIterationResult


# ── SECRET_KEY validation ────────────────────────────────────────────────────

if settings.ENV == "production" and not settings.FLASK_SECRET_KEY:
    logger.error("FLASK_SECRET_KEY must be set in production. Exiting.")
    sys.exit(1)

if not settings.FLASK_SECRET_KEY:
    logger.warning(
        "FLASK_SECRET_KEY is not set. Using fallback secret for development only. "
        "Set FLASK_SECRET_KEY before deploying to production."
    )

app = Flask(__name__)
app.config["SECRET_KEY"] = settings.FLASK_SECRET_KEY or "oracleforge-injective-nova-2026"
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"]}})

register_auth_middleware(app)


# ── Global singletons ────────────────────────────────────────────────────────

_llm = OpenAI(
    api_key=settings.SIGNAL_ENGINE_API_KEY,
    base_url=settings.SIGNAL_ENGINE_BASE_URL or None,
)
_debate_engine = DebateEngine(_llm, model=settings.SIGNAL_ENGINE_MODEL_NAME)
_risk_committee = RiskCommittee(_llm, model=settings.SIGNAL_ENGINE_MODEL_NAME)
_risk_manager = RiskManager(RiskConfig(
    total_capital_usd=float(os.getenv("TOTAL_CAPITAL_USD", "10000")),
    max_position_pct=float(os.getenv("MAX_POSITION_PCT", "0.05")),
    max_daily_loss_pct=float(os.getenv("MAX_DAILY_LOSS_PCT", "0.02")),
    max_leverage=int(os.getenv("MAX_LEVERAGE", "3")),
    profile=os.getenv("RISK_PROFILE", "medium"),
))
_social = SocialSentinelAgent()
_onchain = OnChainSentinelAgent()
_macro = MacroSentinelAgent()
_coingecko = CoinGeckoClient(api_key=os.getenv("COINGECKO_API_KEY"))


# ── Secure executor initialization ───────────────────────────────────────────

_private_key_hex = ""
_injective_mock = os.getenv("INJECTIVE_MOCK", "true").lower() == "true"
if not _injective_mock:
    try:
        _private_key_hex = KeyManager().get_private_key()
    except KeyManagerError as e:
        logger.error(f"Failed to load Injective private key: {e}")
        sys.exit(1)

_executor = InjectiveExecutor(
    private_key_hex=_private_key_hex,
    network=os.getenv("INJECTIVE_NETWORK", "testnet"),
    mock=_injective_mock,
)

active_signals: list[dict] = []


_mcp = MCPInterface(_executor, _risk_manager)


# ── Signal generation loop ────────────────────────────────────────────────────

TRADING_ASSETS: list[str] = [a.strip().upper() for a in settings.TRADING_ASSETS.split(",") if a.strip()]


def _run_one_signal_iteration(asset: str) -> LoopIterationResult:
    """Single iteration of the signal loop for one asset; returns a summary for logging/observability."""
    started_at = datetime.now(tz=timezone.utc)
    asset = asset.upper()

    try:
        market = _coingecko.get_market_data(asset)
    except Exception as e:
        raise RecoverableLoopError(f"CoinGecko data fetch failed: {e}") from e

    current_price = market.price_usd if market else 0.0
    if current_price <= 0:
        raise RecoverableLoopError(f"Invalid price for {asset}: {current_price}")

    # Step 1: collect sentinel summaries in parallel
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
            f_social  = pool.submit(_social.research,  asset, [asset])
            f_onchain = pool.submit(_onchain.research, asset, [asset])
            f_macro   = pool.submit(_macro.research,   asset, [asset])
            social_s  = f_social.result()
            onchain_s = f_onchain.result()
            macro_s   = f_macro.result()
    except Exception as e:
        raise RecoverableLoopError(f"Sentinel data collection failed: {e}") from e

    # Step 2: real Bull/Bear debate → Trader decision (with memory)
    try:
        memory = get_trader_memory(asset)
        decision = _debate_engine.run(social_s, onchain_s, macro_s, asset, memory=memory)
    except Exception as e:
        raise RecoverableLoopError(f"Debate/LLM step failed: {e}") from e

    # Write debate log to forum so dashboard still shows it
    from ForumEngine.monitor import _write
    for line in decision["debate_log"].splitlines():
        src = "BULL" if line.startswith("[BULL") else "BEAR" if line.startswith("[BEAR") else "TRADER"
        _write(line, src)

    # Step 3: build TradingSignal from debate decision
    direction = Direction(decision.get("direction", "NEUTRAL"))
    confidence = float(decision.get("confidence", 0.0))
    sl, tps = calc_sl_tp(direction, current_price)
    signal = TradingSignal(
        asset=asset,
        signal=direction,
        confidence=confidence,
        entry_range=(current_price * 0.998, current_price * 1.002),
        stop_loss=sl,
        take_profit=tps,
        reasoning=decision.get("reasoning", ""),
        consensus_tag=decision.get("consensus", ""),
    )

    # Step 4: risk committee votes (majority of 3)
    base_size = _risk_manager.position_size_usd(confidence)
    approved, size_usd, reason = _risk_committee.evaluate(decision, base_size)
    if _risk_manager._suspended:
        approved, reason = False, "Daily loss limit reached"

    logger.info(f"Signal: {signal.signal} conf={signal.confidence:.2f} approved={approved} ({reason})")

    executed = False
    exec_error: str | None = None
    if approved and size_usd > 0:
        result = _executor.open_position(signal, size_usd)
        if result.success:
            signal.tx_hash = result.tx_hash
            executed = True
        else:
            signal.status = SignalStatus.EXEC_FAILED
            exec_error = result.error

    save_signal(signal, error=exec_error)

    sig_dict = signal.model_dump(mode="json")
    active_signals.append(sig_dict)
    if len(active_signals) > 100:
        active_signals.pop(0)

    socketio.emit("new_signal", sig_dict)

    ended_at = datetime.now(tz=timezone.utc)
    return LoopIterationResult(
        started_at=started_at,
        ended_at=ended_at,
        signal_generated=True,
        direction=signal.signal.value,
        confidence=signal.confidence,
        approved=approved,
        executed=executed,
        error=signal.status == SignalStatus.EXEC_FAILED,
        error_message=exec_error or "",
    )


def _run_all_assets() -> list[LoopIterationResult]:
    """Run signal generation for every configured asset sequentially in one loop tick."""
    results: list[LoopIterationResult] = []
    for asset in TRADING_ASSETS:
        if not _signal_loop.is_running():
            logger.info("Loop stop requested; exiting asset cycle early")
            break
        try:
            result = _run_one_signal_iteration(asset)
            results.append(result)
        except FatalLoopError:
            raise
        except Exception as e:
            # Per-asset errors are recoverable so other assets still run.
            logger.exception(f"Unexpected error for {asset}: {e}")
            results.append(LoopIterationResult(
                started_at=datetime.now(tz=timezone.utc),
                ended_at=datetime.now(tz=timezone.utc),
                signal_generated=False,
                direction="NEUTRAL",
                confidence=0.0,
                approved=False,
                executed=False,
                error=True,
                error_message=str(e),
            ))
    return results


_signal_loop = SignalLoop(
    iteration_fn=_run_all_assets,
    socketio=socketio,
    interval_seconds=300,
)


# ── Routes ────────────────────────────────────────────────────────────────────

STATUS_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>OracleForge API</title>
<style>
:root{--bg:#0a0e1a;--text:#e2e8f0;--muted:#6b7280;--blue:#3b82f6;}
body{font-family:system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0}
.card{background:#111827;border:1px solid #1f2937;border-radius:12px;padding:32px 40px;max-width:520px;text-align:center}
h1{margin:0 0 8px;font-size:24px}
p{margin:0;color:var(--muted);line-height:1.6}
.api{margin-top:20px;font-family:monospace;font-size:13px;background:#0d1425;padding:12px;border-radius:8px;color:var(--blue)}
</style>
</head>
<body>
<div class="card">
  <h1>🔱 OracleForge API</h1>
  <p>Flask is running in API-only mode. Use the Next.js frontend in <code>web/</code>.</p>
  <div class="api">GET /api/signals</div>
</div>
</body>
</html>"""


@app.route("/")
def index():
    return STATUS_HTML


@app.route("/api/signals")
def get_signals():
    return jsonify(get_recent_signals(20))


@app.route("/api/signals/<signal_id>/result", methods=["POST"])
def update_signal_result():
    data = request.get_json() or {}
    mark_signal_result(data["signal_id"], data["status"])
    return jsonify({"success": True})


@app.route("/api/mcp", methods=["POST"])
def mcp_command():
    data = request.get_json() or {}
    text = data.get("text", "")
    price = float(data.get("price", 0))
    result = _mcp.handle(text, price)
    return jsonify(result)


@app.route("/api/config")
def get_config():
    """Return current settings for the dashboard (sensitive values masked)."""
    def mask(v: str | None) -> str:
        if not v:
            return ""
        return v[:4] + "****" if len(v) > 8 else "****"

    return jsonify({
        "llm": {
            "default": {
                "provider": "OpenAI",
                "baseUrl": settings.SIGNAL_ENGINE_BASE_URL or "https://api.openai.com/v1",
                "apiKey": mask(settings.SIGNAL_ENGINE_API_KEY),
                "model": settings.SIGNAL_ENGINE_MODEL_NAME,
            },
            "Social": {
                "provider": "OpenAI",
                "baseUrl": settings.SIGNAL_ENGINE_BASE_URL or "https://api.openai.com/v1",
                "apiKey": mask(settings.SIGNAL_ENGINE_API_KEY),
                "model": settings.SIGNAL_ENGINE_MODEL_NAME,
            },
            "OnChain": {
                "provider": "OpenAI",
                "baseUrl": settings.SIGNAL_ENGINE_BASE_URL or "https://api.openai.com/v1",
                "apiKey": mask(settings.SIGNAL_ENGINE_API_KEY),
                "model": settings.SIGNAL_ENGINE_MODEL_NAME,
            },
            "Macro": {
                "provider": "OpenAI",
                "baseUrl": settings.SIGNAL_ENGINE_BASE_URL or "https://api.openai.com/v1",
                "apiKey": mask(settings.SIGNAL_ENGINE_API_KEY),
                "model": settings.SIGNAL_ENGINE_MODEL_NAME,
            },
            "Host": {
                "provider": settings.FORUM_HOST_BASE_URL or "OpenAI",
                "baseUrl": settings.FORUM_HOST_BASE_URL or "https://api.openai.com/v1",
                "apiKey": mask(settings.FORUM_HOST_API_KEY),
                "model": settings.FORUM_HOST_MODEL_NAME or settings.SIGNAL_ENGINE_MODEL_NAME,
            },
        },
        "risk": {
            "totalCapital": _risk_manager.config.total_capital_usd,
            "maxPositionPercent": _risk_manager.config.max_position_pct * 100,
            "maxDailyLoss": _risk_manager.config.total_capital_usd * _risk_manager.config.max_daily_loss_pct,
            "leverageLimit": _risk_manager.config.max_leverage,
        },
        "dataSources": {
            "twitterApiKey": mask(os.getenv("TWITTER_BEARER_TOKEN")),
            "redditApiKey": mask(os.getenv("REDDIT_CLIENT_ID")),
            "coingeckoApiKey": mask(os.getenv("COINGECKO_API_KEY")),
        },
        "injective": {
            "network": os.getenv("INJECTIVE_NETWORK", "testnet"),
            "privateKey": "****************",
            "mock": os.getenv("INJECTIVE_MOCK", "true").lower() == "true",
        },
        "forumIntervalMinutes": 5,
        "publicReadAccess": settings.PUBLIC_READ_ACCESS,
    })


@app.route("/api/positions")
def get_positions():
    return jsonify(_executor.query_positions())


@app.route("/api/forum/log")
def forum_log():
    return jsonify({"lines": get_forum_log()[-100:]})


@app.route("/api/system/status")
def system_status():
    return jsonify(_signal_loop.get_state())


@app.route("/api/system/errors")
def system_errors():
    from SignalEngine.db import get_recent_loop_errors
    return jsonify({"errors": get_recent_loop_errors(20)})


@app.route("/api/system/start", methods=["POST"])
def start_system():
    start_forum_monitoring()
    success, message = _signal_loop.start()
    if not success:
        return jsonify({"success": False, "message": message}), 409
    return jsonify({"success": True, "message": message})


@app.route("/api/system/stop", methods=["POST"])
def stop_system():
    stop_forum_monitoring()
    success, message = _signal_loop.stop()
    return jsonify({"success": success, "message": message})


@socketio.on("connect")
def on_connect():
    emit("status", "Connected to OracleForge")


if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "5000"))
    logger.info(f"OracleForge starting on http://{host}:{port}")
    socketio.run(app, host=host, port=port, debug=False, allow_unsafe_werkzeug=True)
