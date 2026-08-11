# 🔱 OracleForge

<p align="center">
  <b>An AI-native, sentiment-driven trading signal engine running on Injective</b><br>
  <sub>Three AI agents debate. One agent executes on-chain. A Next.js dashboard displays it in real time.</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Injective-iAgent_SDK-00B5D8?style=flat-square" />
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

---

## What Is This

OracleForge is an **AI-native, sentiment-driven trading signal engine**. It closes the loop between "analysis" and "execution":

```
Social sentiment  ┐
On-chain data     ├─→ Multi-agent debate ─→ Trading signal ─→ Risk review ─→ Execution on Injective
Macro events      ┘
```

- **SocialSentinel**: sentiment analysis of Twitter/X, Reddit, and CryptoPanic
- **OnChainSentinel**: Injective RPC, CoinGecko, open interest / funding rates / whale activity
- **MacroSentinel**: macro events such as FOMC decisions, CPI, and nonfarm payrolls
- **ForumEngine**: structured three-agent debate that identifies consensus/disagreement
- **SignalEngine**: parses debate outcomes into structured trading signals
- **RiskManager + RiskCommittee**: position sizing, intraday loss protection, three-member committee voting
- **InjectiveExecutor**: executes perpetual contract trades via the iAgent SDK
- **Next.js Dashboard**: real-time signals, forum, positions, settings, AI trading assistant

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         OracleForge                                 │
│                                                                     │
│   SocialSentinel   OnChainSentinel   MacroSentinel                  │
│   ─────────────    ──────────────    ─────────────                  │
│   Twitter/X        Injective RPC     Macro event calendar           │
│   Reddit           CoinGecko         BTC dominance                  │
│   CryptoPanic      OI / funding rate Market regime                  │
│        │                │                  │                        │
│        └────────────────┼──────────────────┘                        │
│                         ▼                                           │
│                   ForumEngine                                       │
│           Bull vs Bear debate + Trader decision                     │
│           [HIGH_CONSENSUS] / [CONFLICT] / [INVESTIGATE]             │
│                         │                                           │
│                         ▼                                           │
│                   SignalEngine                                      │
│           Forum text → TradingSignal JSON                           │
│           Confidence aggregation + stop-loss / take-profit          │
│                         │                                           │
│                         ▼                                           │
│              RiskManager + RiskCommittee                            │
│           Position sizing + daily loss cap + 3-member vote          │
│                         │                                           │
│                         ▼                                           │
│               InjectiveExecutor                                     │
│           iAgent SDK — open / close perpetual positions             │
│                         │                                           │
│                         ▼                                           │
│              Next.js Dashboard (web/)                               │
│           Signals / forum / positions / settings / AI assistant     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Requirements

- Python 3.10+
- Node.js 24+
- pip + npm

### 1. Clone the repository

```bash
git clone https://github.com/airbate/oracleforge.git
cd oracleforge
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in at least:

```bash
SIGNAL_ENGINE_API_KEY=sk-your-openai-key
FORUM_HOST_API_KEY=sk-your-forum-host-key
FLASK_SECRET_KEY=$(openssl rand -hex 32)   # a strong random key is required in production
ADMIN_API_KEY=$(openssl rand -hex 32)      # admin API key that protects sensitive endpoints
```

**Zero-config demo** (no real LLM calls, no real on-chain execution):

```bash
SIGNAL_ENGINE_API_KEY=sk-placeholder
FORUM_HOST_API_KEY=sk-placeholder
INJECTIVE_MOCK=true
```

### 2.1 Secure private key storage (important)

⚠️ **Do not put `INJECTIVE_PRIVATE_KEY` directly in `.env`.**

OracleForge stores private keys in the system keychain (macOS Keychain) or in an AES-encrypted file.

**macOS / GUI environments (recommended):**

```bash
python -m utils.key_manager import --key 0xYOUR_PRIVATE_KEY
```

**Headless / CI / server environments (encrypted file fallback):**

```bash
KEY_STORAGE_BACKEND=encrypted_file KEY_FILE_PASSWORD=STRONG_PASSWORD python -m utils.key_manager import --key 0xYOUR_PRIVATE_KEY
```

After importing, remove `INJECTIVE_PRIVATE_KEY` from `.env` and from your shell history. Verify the key was stored:

```bash
python -m utils.key_manager check
```

### 3. Install backend dependencies

```bash
pip install -r requirements.txt
```

> Note: on Python 3.13 you may need to relax the pydantic version constraint by using `pydantic>=2.5.2`.

### 4. Start the backend (API-only mode)

```bash
python nova_app.py
```

The backend runs at `http://localhost:5000`. Flask now serves an API only; `/` shows a status page that points you to the Next.js frontend.

> The legacy embedded Flask dashboard has been removed in favor of the Node.js/Next.js frontend under `web/`.

### 5. Install and start the frontend

In a new terminal:

```bash
cd web
cp .env.local.example .env.local
# edit .env.local — if the backend has an ADMIN_API_KEY set, fill in NEXT_PUBLIC_ADMIN_API_KEY
npm install
npm run dev
```

The frontend runs at `http://localhost:3001` by default.

### 6. Start using it

- Open `http://localhost:3001` in your browser
- Click "Start System" on the home page to launch the signal loop
- Or send natural-language commands to the AI trading assistant, e.g.:
  - `Buy INJ with 2x leverage` (`做多 INJ 2x`)
  - `Check positions` (`查询持仓`)
  - `Close all positions` (`全部平仓`)

---

## Frontend Data Modes

The frontend supports two data modes, switched via an environment variable:

### Mock mode (default, for development)

```bash
cd web
npm run dev
```

The frontend uses fake data from `web/src/lib/mock.ts` and does not depend on the backend.

### Real backend API mode

```bash
cd web
NEXT_PUBLIC_USE_MOCK=false npm run dev
```

The frontend calls the API at `http://localhost:5000` through `web/src/hooks/useData.ts`:

| Hook | API endpoint |
|---|---|
| `useSignals` | `GET /api/signals` |
| `usePositions` | `GET /api/positions` |
| `useForum` | `GET /api/forum/log` |
| `useSettings` | `GET /api/config` |
| `sendMcpCommand` | `POST /api/mcp` |

---

## Configuration

All configuration is managed through `.env`:

| Variable | Description | Default |
|---|---|---|
| `HOST` | Flask listen address | `0.0.0.0` |
| `PORT` | Flask port | `5000` |
| `FLASK_SECRET_KEY` | Flask session key (must be set in production) | — |
| `ENV` | Runtime environment: `development` or `production` | `development` |
| `ADMIN_API_KEY` | Admin API key protecting sensitive endpoints | — |
| `PUBLIC_READ_ACCESS` | Allow anonymous read-only access (GET/HEAD) | `false` |
| `KEY_STORAGE_BACKEND` | Private key storage backend: `keyring` or `encrypted_file` | `keyring` |
| `KEY_FILE_PASSWORD` | Encryption password for the `encrypted_file` backend | — |
| `KEY_FILE_PATH` | Encrypted file path (default `~/.oracleforge/key.enc`) | — |
| `SIGNAL_ENGINE_API_KEY` | LLM API key for signal parsing | — |
| `SIGNAL_ENGINE_BASE_URL` | LLM base URL for signal parsing | `https://api.openai.com/v1` |
| `SIGNAL_ENGINE_MODEL_NAME` | Model used for signal parsing | `gpt-4o-mini` |
| `FORUM_HOST_API_KEY` | LLM API key for the forum host | — |
| `FORUM_HOST_BASE_URL` | LLM base URL for the forum host | — |
| `FORUM_HOST_MODEL_NAME` | Model used for the forum host | — |
| `TWITTER_BEARER_TOKEN` | Twitter API v2 Bearer Token | — |
| `REDDIT_CLIENT_ID` | Reddit app client ID | — |
| `REDDIT_CLIENT_SECRET` | Reddit app client secret | — |
| `COINGECKO_API_KEY` | CoinGecko Pro API Key | — |
| `TRADING_ASSETS` | Comma-separated list of assets to trade | `INJ` |
| `INJECTIVE_NETWORK` | `testnet` or `mainnet` | `testnet` |
| `INJECTIVE_PRIVATE_KEY` | ⚠️ **Deprecated** — import it via `utils/key_manager.py` instead | — |
| `INJECTIVE_MOCK` | `true` = no real on-chain execution | `true` |
| `TOTAL_CAPITAL_USD` | Total trading capital | `10000` |
| `MAX_POSITION_PCT` | Max position size per trade | `0.05` |
| `MAX_DAILY_LOSS_PCT` | Intraday loss limit | `0.02` |
| `MAX_LEVERAGE` | Max leverage | `3` |
| `RISK_PROFILE` | `conservative` / `medium` / `aggressive` | `medium` |

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `GET /` | GET | API status page (points you to the Next.js frontend) |
| `/api/system/start` | POST | Start agents and the signal loop (requires `X-API-Key`) |
| `/api/system/stop` | POST | Stop the system (requires `X-API-Key`) |
| `/api/system/status` | GET | Signal loop running status |
| `/api/system/errors` | GET | Recent loop error logs |
| `/api/signals` | GET | Recent signals |
| `/api/signals/<id>/result` | POST | Mark a signal result (TP/SL/EXPIRED, requires `X-API-Key`) |
| `/api/positions` | GET | Current Injective positions |
| `/api/forum/log` | GET | Forum debate logs |
| `/api/mcp` | POST | Natural-language trading instructions (requires `X-API-Key`) |
| `/api/config` | GET | Current system configuration (used by the frontend settings page) |

**MCP example:**

```bash
curl -X POST http://localhost:5000/api/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $ADMIN_API_KEY" \
  -d '{"text": "Buy 5% INJ 2x", "price": 25.0}'
```

> When `ADMIN_API_KEY` is configured, all sensitive endpoints (`POST /api/system/start`, `POST /api/system/stop`, `POST /api/mcp`, `POST /api/signals/<id>/result`) require the `X-API-Key` header.
> Read-only endpoints (`GET /api/signals`, `GET /api/positions`, etc.) require authentication by default; set `PUBLIC_READ_ACCESS=true` to allow anonymous access.

---

## Project Structure

```
oracleforge/
├── nova_app.py              # Flask main app (API-only)
├── config.py                # Pydantic Settings
├── .env.example             # Environment variable template
├── requirements.txt         # Python dependencies
│
├── SocialSentinel/          # Social media sentiment collection
├── OnChainSentinel/         # On-chain data collection
├── MacroSentinel/           # Macro event collection
│
├── ForumEngine/             # Agent debate engine
│   ├── debate.py            # Two-round Bull/Bear debate
│   ├── monitor.py           # Forum log monitoring
│   └── llm_host.py          # Forum Host LLM
│
├── SignalEngine/
│   ├── schema.py            # TradingSignal data model
│   ├── parser.py            # Forum text → JSON
│   ├── db.py                # SQLite persistence
│   └── memory.py            # Trader memory
│
├── RiskManager/
│   ├── risk_manager.py      # Position sizing + intraday loss protection
│   └── committee.py         # Three-member committee voting
│
├── InjectiveExecutor/
│   ├── executor.py          # iAgent SDK execution
│   └── mcp_interface.py     # Natural-language instruction parsing
│
├── web/                     # Next.js 16 frontend (Node.js, the only official UI)
│   ├── src/app/             # Page routes
│   ├── src/components/      # Components
│   ├── src/hooks/useData.ts # Backend API hooks
│   ├── src/lib/api.ts       # API client
│   ├── src/lib/mock.ts      # Mock data
│   └── package.json
│
└── tests/                   # Unit tests + integration tests
```

---

## Frontend Pages

| Page | Route | Features |
|---|---|---|
| Dashboard | `/` | Prices, stats, recent signals, quick trading, signal timeline |
| AI Trading Assistant | `/chat` | Natural-language trading commands and Q&A |
| Forum Debate | `/forum` | Multi-agent debate display |
| Portfolio & History | `/portfolio` | Current positions, trade history, signal history |
| Data Sources | `/sources` | Sentiment heatmap, source filtering |
| System Settings | `/settings` | LLM, risk, data sources, Injective, and signal frequency configuration |

---

## Signal Flow

```
1. The three Sentinels collect market intelligence in parallel
2. ForumEngine runs a two-round Bull vs Bear debate
3. The Trader Agent synthesizes the debate into direction / confidence / rationale
4. RiskManager + RiskCommittee review position size and risk
5. InjectiveExecutor executes on-chain (mock or real)
6. Signals are persisted to SQLite and pushed to the frontend via SocketIO
```

---

## Development Tips

### Frontend hot reload stuck?

```bash
cd web
rm -rf .next
npm run dev
```

### Backend port 5000 already in use?

```bash
lsof -ti:5000 | xargs kill -9
python nova_app.py
```

### Frontend port 3001 already in use?

```bash
cd web
npm run dev -- --port 3002
```

### Reset the database

```bash
rm -f signals.db
python nova_app.py
```

---

## Migration Notes

### Migrating from the old `.env`

If you previously stored `INJECTIVE_PRIVATE_KEY` in `.env`, migrate as follows:

1. Install the new dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Import the private key into secure storage:
   ```bash
   python -m utils.key_manager import --key $INJECTIVE_PRIVATE_KEY
   ```

3. Remove the `INJECTIVE_PRIVATE_KEY` line from `.env` and clear your shell history:
   ```bash
   history -c  # or manually delete the relevant lines in ~/.zsh_history
   ```

4. Add the new security configuration:
   ```bash
   FLASK_SECRET_KEY=$(openssl rand -hex 32)
   ADMIN_API_KEY=$(openssl rand -hex 32)
   ```

5. Restart the backend.

---

## Tests

```bash
pytest tests/
```

---

## License

MIT — see [LICENSE](LICENSE)

---

<p align="center">
  Built with care on Injective
</p>
