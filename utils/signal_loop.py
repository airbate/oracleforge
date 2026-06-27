"""
SignalLoop controller for OracleForge.

Encapsulates the background signal-generation thread, graceful start/stop,
running-state tracking, and structured error handling.
"""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Callable, Optional

from flask_socketio import SocketIO
from loguru import logger


class LoopErrorCategory(str, Enum):
    RECOVERABLE = "RECOVERABLE"
    FATAL = "FATAL"


@dataclass
class LoopIterationResult:
    """Summary of one loop iteration."""
    started_at: datetime
    ended_at: datetime
    signal_generated: bool = False
    direction: str = "NEUTRAL"
    confidence: float = 0.0
    approved: bool = False
    executed: bool = False
    error: bool = False
    error_category: Optional[LoopErrorCategory] = None
    error_message: str = ""


@dataclass
class LoopState:
    running: bool = False
    started_at: Optional[datetime] = None
    iteration_count: int = 0
    error_count: int = 0
    last_result: Optional[LoopIterationResult] = None
    last_error: Optional[dict] = None


class SignalLoop:
    """
    Runs a background thread that periodically generates trading signals.

    - Uses threading.Event for near-instant shutdown.
    - Prevents duplicate threads via idempotent start.
    - Classifies errors as recoverable or fatal.
    - Emits SocketIO events for signals and loop errors.
    """

    def __init__(
        self,
        iteration_fn: Callable[[], LoopIterationResult],
        socketio: Optional[SocketIO] = None,
        interval_seconds: int = 300,
    ):
        self._iteration_fn = iteration_fn
        self._socketio = socketio
        self._interval = interval_seconds
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()
        self._state = LoopState()

    # ── public control ───────────────────────────────────────────────────────

    def start(self) -> tuple[bool, str]:
        """Start the loop if not already running. Returns (success, message)."""
        with self._lock:
            if self._state.running and self._thread is not None and self._thread.is_alive():
                return False, "Signal loop is already running"

            self._stop_event.clear()
            self._state.running = True
            self._state.started_at = datetime.now(tz=timezone.utc)
            self._thread = threading.Thread(target=self._run, daemon=True)
            self._thread.start()
            logger.info("Signal loop started")
            return True, "Signal loop started"

    def stop(self) -> tuple[bool, str]:
        """Signal the loop to stop and wait for the thread to exit."""
        with self._lock:
            if not self._state.running or self._thread is None:
                return False, "Signal loop is not running"

        logger.info("Signal loop stop requested")
        self._stop_event.set()
        thread = self._thread
        if thread is not None and thread.is_alive():
            thread.join(timeout=5)

        with self._lock:
            self._state.running = False
            if thread.is_alive():
                return False, "Signal loop thread did not stop in time"
            self._thread = None

        logger.info("Signal loop stopped")
        return True, "Signal loop stopped"

    def is_running(self) -> bool:
        with self._lock:
            return self._state.running and (self._thread is not None and self._thread.is_alive())

    def get_state(self) -> dict:
        with self._lock:
            last_result = None
            if self._state.last_result is not None:
                r = self._state.last_result
                last_result = {
                    "signal_generated": r.signal_generated,
                    "direction": r.direction,
                    "confidence": r.confidence,
                    "approved": r.approved,
                    "executed": r.executed,
                    "error": r.error,
                    "error_category": r.error_category.value if r.error_category else None,
                    "error_message": r.error_message,
                    "started_at": r.started_at.isoformat(),
                    "ended_at": r.ended_at.isoformat(),
                }
            running = self._state.running and (self._thread is not None and self._thread.is_alive())
            return {
                "running": running,
                "started_at": self._state.started_at.isoformat() if self._state.started_at else None,
                "iteration_count": self._state.iteration_count,
                "error_count": self._state.error_count,
                "last_result": last_result,
                "last_error": self._state.last_error,
            }

    # ── main loop ────────────────────────────────────────────────────────────

    def _run(self) -> None:
        """Internal loop entry point."""
        logger.info(f"Signal loop running every {self._interval}s")
        while not self._stop_event.is_set():
            iteration_start = time.monotonic()
            results: list[LoopIterationResult] = []
            try:
                raw = self._iteration_fn()
                if isinstance(raw, list):
                    results = [r for r in raw if isinstance(r, LoopIterationResult)]
                elif isinstance(raw, LoopIterationResult):
                    results = [raw]
            except FatalLoopError as e:
                result = LoopIterationResult(
                    started_at=datetime.now(tz=timezone.utc),
                    ended_at=datetime.now(tz=timezone.utc),
                    error=True,
                    error_category=LoopErrorCategory.FATAL,
                    error_message=str(e),
                )
                self._handle_result(result)
                logger.exception(f"Fatal loop error, stopping: {e}")
                break
            except Exception as e:  # noqa: BLE001
                result = LoopIterationResult(
                    started_at=datetime.now(tz=timezone.utc),
                    ended_at=datetime.now(tz=timezone.utc),
                    error=True,
                    error_category=LoopErrorCategory.RECOVERABLE,
                    error_message=str(e),
                )
                self._handle_result(result)
                logger.exception(f"Recoverable loop error: {e}")
            else:
                if not results:
                    results = [LoopIterationResult(
                        started_at=datetime.now(tz=timezone.utc),
                        ended_at=datetime.now(tz=timezone.utc),
                    )]
                for result in results:
                    self._handle_result(result)

            elapsed = time.monotonic() - iteration_start
            remaining = self._interval - elapsed
            if remaining > 0:
                # wait returns True if stop_event is set, False on timeout
                stopped = self._stop_event.wait(remaining)
                if stopped:
                    break

        with self._lock:
            self._state.running = False
            self._thread = None
        logger.info("Signal loop thread exited")

    def _handle_result(self, result: LoopIterationResult) -> None:
        with self._lock:
            self._state.iteration_count += 1
            self._state.last_result = result
            if result.error:
                self._state.error_count += 1
                self._state.last_error = {
                    "category": result.error_category.value if result.error_category else None,
                    "message": result.error_message,
                    "timestamp": datetime.now(tz=timezone.utc).isoformat(),
                }

        summary = (
            f"Loop iteration complete in "
            f"{(result.ended_at - result.started_at).total_seconds():.2f}s | "
            f"signal={result.direction} conf={result.confidence:.2f} "
            f"approved={result.approved} executed={result.executed} "
            f"error={result.error}"
        )
        logger.info(summary)

        if result.error and self._socketio is not None:
            self._socketio.emit(
                "loop_error",
                {
                    "category": result.error_category.value if result.error_category else None,
                    "message": result.error_message,
                    "timestamp": datetime.now(tz=timezone.utc).isoformat(),
                },
            )


class FatalLoopError(Exception):
    """Raised when the loop must stop immediately (e.g., missing key material)."""


class RecoverableLoopError(Exception):
    """Raised for transient failures that should not stop the loop."""
