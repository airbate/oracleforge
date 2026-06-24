"""Tasks 8.1-8.5: Injective perpetual contract executor via injective-py SDK."""

from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass
from typing import Optional
from loguru import logger

try:
    from decimal import Decimal, ROUND_DOWN
    from pyinjective.async_client import AsyncClient
    from pyinjective.core.network import Network
    from pyinjective.transaction import Transaction
    from pyinjective.wallet import PrivateKey
    from pyinjective.composer import Composer
    INJECTIVE_AVAILABLE = True
except ImportError:
    INJECTIVE_AVAILABLE = False
    logger.warning("InjectiveExecutor: injective-py not installed — running in mock mode")

from SignalEngine.schema import Direction, TradingSignal, SignalStatus


@dataclass
class ExecResult:
    success: bool
    tx_hash: str = ""
    error: str = ""
    mock: bool = False


class InjectiveExecutor:
    """Tasks 8.1-8.5: Open/close perpetual positions on Injective."""

    # INJ/USDT PERP market id
    MARKET_IDS = {
        "mainnet": "0x9b9980167ecc3645ff1a5517886652d94a0825e54a77d2057cbbe3ebee015963",
        "testnet": "0x17ef48032cb24375ba7c2e39f384e56433bcab20cbee9a7357e4cba2eb00abe6",
    }
    GAS_LIMIT = 200_000
    GAS_PRICE = 500_000_000  # 0.5 Gwei in INJ

    def __init__(
        self,
        private_key_hex: str,
        network: str = "testnet",   # Task 8.7: default to testnet
        mock: bool = False,
    ):
        self._mock = mock or not INJECTIVE_AVAILABLE
        self._network_name = network

        if not self._mock:
            self._net = Network.testnet() if network == "testnet" else Network.mainnet()
            self._priv_key = PrivateKey.from_hex(private_key_hex)
            self._pub_key = self._priv_key.to_public_key()
            self._address = self._pub_key.to_address()

    # ── public API ─────────────────────────────────────────────────────────

    def open_position(self, signal: TradingSignal, size_usd: float, leverage: int = 2) -> ExecResult:
        """Task 8.2: Submit a perpetual open order."""
        if self._mock:
            return self._mock_exec(f"OPEN {signal.signal} {signal.asset} ${size_usd:.0f} x{leverage}")

        try:
            return asyncio.run(self._async_open(signal, size_usd, leverage))
        except Exception as e:
            return ExecResult(success=False, error=str(e))

    def close_position(self, market_id: str, order_hash: str) -> ExecResult:
        """Task 8.3: Close an open position."""
        if self._mock:
            return self._mock_exec(f"CLOSE order={order_hash[:8]}")
        try:
            return asyncio.run(self._async_close(market_id, order_hash))
        except Exception as e:
            return ExecResult(success=False, error=str(e))

    def query_positions(self) -> list[dict]:
        """Task 8.4: Return open positions for the wallet."""
        if self._mock:
            return []
        try:
            return asyncio.run(self._async_positions())
        except Exception as e:
            logger.warning(f"query_positions failed: {e}")
            return []

    # ── retry wrapper (Task 8.5) ────────────────────────────────────────────

    def _with_retry(self, fn, *args, max_retries: int = 3) -> ExecResult:
        for attempt in range(max_retries):
            result = fn(*args)
            if result.success:
                return result
            wait = 2 ** attempt
            logger.warning(f"InjectiveExecutor: attempt {attempt+1} failed — retrying in {wait}s")
            time.sleep(wait)
        result.error = f"Failed after {max_retries} attempts: {result.error}"
        return result

    # ── async internals ─────────────────────────────────────────────────────

    async def _build_and_broadcast(self, composer: Composer, client: AsyncClient, msg) -> ExecResult:
        """Sign and broadcast a single message, return ExecResult."""
        account = await client.fetch_account(self._address.to_acc_bech32())
        gas_fee = composer.fee(
            price=self.GAS_PRICE,
            gas_limit=self.GAS_LIMIT,
            fee_price="inj",
        )
        tx = (
            Transaction()
            .with_messages(msg)
            .with_sequence(account.sequence)
            .with_account_num(account.account_number)
            .with_chain_id(self._net.chain_id)
            .with_gas(self.GAS_LIMIT)
            .with_fee(gas_fee)
            .with_memo("OracleForge")
            .with_timeout_height(client.timeout_height)
        )
        sign_doc = tx.get_sign_doc(self._pub_key)
        sig = self._priv_key.sign(sign_doc.SerializeToString())
        tx_raw = tx.get_tx_data(sig, self._pub_key)
        res = await client.broadcast_tx_sync_mode(tx_raw)
        if res.tx_response.code == 0:
            return ExecResult(success=True, tx_hash=res.tx_response.txhash)
        return ExecResult(success=False, error=res.tx_response.raw_log)

    async def _async_open(self, signal: TradingSignal, size_usd: float, leverage: int) -> ExecResult:
        client = AsyncClient(self._net)
        await client.sync_timeout_height()
        composer = await Composer.new_using_rest(client)

        market_id = self.MARKET_IDS[self._network_name]
        is_buy = signal.signal == Direction.LONG

        # Fetch market tick sizes for quantization
        mkt = await client.fetch_derivative_market(market_id=market_id)
        min_price_tick = Decimal(mkt.market.min_price_tick_size)
        min_qty_tick   = Decimal(mkt.market.min_quantity_tick_size)

        # Use worst acceptable price (1% slippage)
        raw_price = Decimal(str(signal.entry_range[0] if is_buy else signal.entry_range[1]))
        slippage   = Decimal("1.01") if is_buy else Decimal("0.99")
        price = ((raw_price * slippage) / min_price_tick).quantize(Decimal("1"), rounding=ROUND_DOWN) * min_price_tick
        qty   = (Decimal(str(size_usd)) / price / min_qty_tick).quantize(Decimal("1"), rounding=ROUND_DOWN) * min_qty_tick
        margin = price * qty / Decimal(str(leverage))

        if qty <= 0:
            return ExecResult(success=False, error=f"Computed qty={qty} too small for ${size_usd:.0f}")

        subaccount_id = self._address.get_subaccount_id(index=0)
        msg = composer.msg_create_derivative_market_order(
            sender=self._address.to_acc_bech32(),
            market_id=market_id,
            subaccount_id=subaccount_id,
            fee_recipient=self._address.to_acc_bech32(),
            price=float(price),
            quantity=float(qty),
            margin=float(margin),
            order_type="BUY" if is_buy else "SELL",
            is_reduce_only=False,
        )
        logger.info(f"[{self._network_name}] {signal.signal} {signal.asset} qty={qty} price={price} margin={margin:.2f}")
        return await self._build_and_broadcast(composer, client, msg)

    async def _async_close(self, market_id: str, order_hash: str) -> ExecResult:
        """Close via reduce-only market order (cancel + re-enter in opposite direction)."""
        client = AsyncClient(self._net)
        await client.sync_timeout_height()
        composer = await Composer.new_using_rest(client)
        subaccount_id = self._address.get_subaccount_id(index=0)
        msg = composer.msg_cancel_derivative_order(
            sender=self._address.to_acc_bech32(),
            market_id=market_id,
            subaccount_id=subaccount_id,
            order_hash=order_hash,
        )
        logger.info(f"[{self._network_name}] Cancelling order {order_hash}")
        return await self._build_and_broadcast(composer, client, msg)

    async def _async_positions(self) -> list[dict]:
        client = AsyncClient(self._net)
        market_id = self.MARKET_IDS[self._network_name]
        resp = await client.fetch_derivative_positions_v2(
            market_id=market_id,
            subaccount_id=self._address.get_subaccount_id(index=0),
        )
        return [{"market_id": p.market_id, "quantity": p.position.quantity,
                 "entry_price": p.position.entry_price, "margin": p.position.margin,
                 "is_long": p.position.is_long} for p in getattr(resp, "state", [])]

    # ── mock ────────────────────────────────────────────────────────────────

    def _mock_exec(self, label: str) -> ExecResult:
        fake_hash = f"0xMOCK_{int(time.time())}"
        logger.info(f"InjectiveExecutor [MOCK] {label} → {fake_hash}")
        return ExecResult(success=True, tx_hash=fake_hash, mock=True)
