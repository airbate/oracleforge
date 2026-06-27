"""Tests for utils/signal_loop.py."""

import threading
import time

import pytest

from utils.signal_loop import SignalLoop, LoopIterationResult, FatalLoopError, RecoverableLoopError
from datetime import datetime, timezone


def test_signal_loop_starts_and_stops():
    calls = []

    def iteration():
        calls.append(1)
        return LoopIterationResult(
            started_at=datetime.now(tz=timezone.utc),
            ended_at=datetime.now(tz=timezone.utc),
        )

    loop = SignalLoop(iteration_fn=iteration, interval_seconds=0.2)
    success, msg = loop.start()
    assert success
    assert loop.is_running()

    time.sleep(0.1)
    success, msg = loop.stop()
    assert success
    assert not loop.is_running()
    assert len(calls) >= 1


def test_signal_loop_prevents_duplicate_start():
    def iteration():
        return LoopIterationResult(
            started_at=datetime.now(tz=timezone.utc),
            ended_at=datetime.now(tz=timezone.utc),
        )

    loop = SignalLoop(iteration_fn=iteration, interval_seconds=0.2)
    loop.start()
    success, msg = loop.start()
    assert not success
    assert "already running" in msg.lower()
    loop.stop()


def test_signal_loop_stop_not_running():
    loop = SignalLoop(iteration_fn=lambda: None, interval_seconds=10)
    success, msg = loop.stop()
    assert not success
    assert "not running" in msg.lower()


def test_signal_loop_fatal_error_stops_loop():
    def iteration():
        raise FatalLoopError("boom")

    loop = SignalLoop(iteration_fn=iteration, interval_seconds=0.2)
    loop.start()
    time.sleep(0.2)
    assert not loop.is_running()


def test_signal_loop_recoverable_error_continues():
    calls = []

    def iteration():
        if len(calls) == 0:
            calls.append(1)
            raise RecoverableLoopError("transient")
        calls.append(2)
        return LoopIterationResult(
            started_at=datetime.now(tz=timezone.utc),
            ended_at=datetime.now(tz=timezone.utc),
        )

    loop = SignalLoop(iteration_fn=iteration, interval_seconds=0.2)
    loop.start()
    time.sleep(0.5)
    assert loop.is_running()
    loop.stop()
    assert len(calls) >= 2


def test_signal_loop_state():
    def iteration():
        return LoopIterationResult(
            started_at=datetime.now(tz=timezone.utc),
            ended_at=datetime.now(tz=timezone.utc),
            signal_generated=True,
            direction="LONG",
            confidence=0.8,
        )

    loop = SignalLoop(iteration_fn=iteration, interval_seconds=0.2)
    loop.start()
    time.sleep(0.1)
    state = loop.get_state()
    assert state["running"] is True
    assert state["iteration_count"] >= 1
    loop.stop()
