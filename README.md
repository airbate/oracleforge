# 🔱 OracleForge

<p align="center">
  <b>AI 原生的情绪驱动交易信号引擎，运行在 Injective 上</b><br>
  <sub>三个 AI Agent 辩论。一个 Agent 在链上执行。一个 Next.js 仪表盘实时展示。</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Injective-iAgent_SDK-00B5D8?style=flat-square" />
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/协议-MIT-green?style=flat-square" />
</p>

---

## 这是什么

OracleForge 是一个 **AI-native 情绪驱动交易信号引擎**。它把"分析"和"执行"连成闭环：

```
Social 情绪  ┐
OnChain 数据 ├─→ 多 Agent 辩论 ─→ 交易信号 ─→ Risk 审核 ─→ Injective 链上执行
Macro 事件   ┘
```

- **SocialSentinel**：Twitter/X、Reddit、CryptoPanic 情绪分析
- **OnChainSentinel**：Injective RPC、CoinGecko、持仓量 / 资金费率 / 鲸鱼动向
- **MacroSentinel**：美联储议息、CPI、非农等宏观事件
- **ForumEngine**：三 Agent 结构化辩论，识别共识/分歧
- **SignalEngine**：把辩论结果解析为结构化交易信号
- **RiskManager + RiskCommittee**：仓位计算、日内亏损保护、三委员投票
- **InjectiveExecutor**：iAgent SDK 执行永续合约交易
- **Next.js Dashboard**：实时信号、论坛、持仓、设置、AI 交易助手

---

## 架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                         OracleForge                                 │
│                                                                      │
│   SocialSentinel   OnChainSentinel   MacroSentinel                  │
│   ─────────────    ──────────────    ─────────────                  │
│   Twitter/X        Injective RPC     宏观事件日历                    │
│   Reddit           CoinGecko         BTC 主导率                     │
│   CryptoPanic      OI / 资金费率     市场环境判断                    │
│        │                │                  │                        │
│        └────────────────┼──────────────────┘                        │
│                         ▼                                           │
│                   ForumEngine                                       │
│           Bull vs Bear 辩论 + Trader 决策                            │
│           [HIGH_CONSENSUS] / [CONFLICT] / [INVESTIGATE]             │
│                         │                                           │
│                         ▼                                           │
│                   SignalEngine                                      │
│           论坛文本 → TradingSignal JSON                              │
│           置信度聚合 + 止损止盈计算                                  │
│                         │                                           │
│                         ▼                                           │
│              RiskManager + RiskCommittee                            │
│           仓位计算 + 日内亏损保护 + 三委员投票                        │
│                         │                                           │
│                         ▼                                           │
│               InjectiveExecutor                                     │
│           iAgent SDK — 永续合约开仓/平仓                             │
│                         │                                           │
│                         ▼                                           │
│              Next.js Dashboard (web/)                               │
│           实时信号 / 论坛 / 持仓 / 设置 / AI 交易助手                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 快速开始

### 环境要求

- Python 3.10+
- Node.js 24+
- pip + npm

### 1. 克隆仓库

```bash
git clone https://github.com/airbate/oracleforge.git
cd oracleforge
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，至少填写：

```bash
SIGNAL_ENGINE_API_KEY=sk-your-openai-key
FORUM_HOST_API_KEY=sk-your-forum-host-key
FLASK_SECRET_KEY=$(openssl rand -hex 32)   # 生产环境必须设置强随机密钥
ADMIN_API_KEY=$(openssl rand -hex 32)      # 管理后台 API Key，保护敏感端点
```

**零配置演示**（不调用真实 LLM，不实际上链）：

```bash
SIGNAL_ENGINE_API_KEY=sk-placeholder
FORUM_HOST_API_KEY=sk-placeholder
INJECTIVE_MOCK=true
```

### 2.1 私钥安全存储（重要）

⚠️ **不要把 `INJECTIVE_PRIVATE_KEY` 直接写在 `.env` 里。**

OracleForge 使用系统钥匙串（macOS Keychain）或 AES 加密文件存储私钥。

**macOS / 有 GUI 的环境（推荐）：**

```bash
python -m utils.key_manager import --key 0x你的私钥
```

**无 GUI / CI / 服务器环境（加密文件回退）：**

```bash
KEY_STORAGE_BACKEND=encrypted_file KEY_FILE_PASSWORD=强密码 python -m utils.key_manager import --key 0x你的私钥
```

导入完成后，从 `.env` 和 shell history 中删除 `INJECTIVE_PRIVATE_KEY`。验证是否存储成功：

```bash
python -m utils.key_manager check
```

### 3. 安装后端依赖

```bash
pip install -r requirements.txt
```

> 注意：Python 3.13 用户可能需要放宽 pydantic 版本限制，使用 `pydantic>=2.5.2`。

### 4. 启动后端（API-only 模式）

```bash
python nova_app.py
```

后端运行在 `http://localhost:5000`。Flask 现在只提供 API，`/` 会显示一个状态页，提示你使用 Next.js 前端。

> 旧的内嵌 Flask Dashboard 已被移除，统一使用 `web/` 中的 Node.js/Next.js 前端。

### 5. 安装并启动前端

新终端：

```bash
cd web
cp .env.local.example .env.local
# 编辑 .env.local，如果后端设置了 ADMIN_API_KEY，请填写 NEXT_PUBLIC_ADMIN_API_KEY
npm install
npm run dev
```

前端默认运行在 `http://localhost:3001`。

### 6. 开始使用

- 打开浏览器访问 `http://localhost:3001`
- 在首页点击"Start System"启动信号循环
- 或在 AI 交易助手中输入自然语言指令，例如：
  - `做多 INJ 2x`
  - `查询持仓`
  - `全部平仓`

---

## 前端数据模式

前端支持两种数据模式，通过环境变量切换：

### Mock 模式（默认，开发用）

```bash
cd web
npm run dev
```

前端使用 `web/src/lib/mock.ts` 中的假数据，不依赖后端。

### 真实后端 API 模式

```bash
cd web
NEXT_PUBLIC_USE_MOCK=false npm run dev
```

前端通过 `web/src/hooks/useData.ts` 调用 `http://localhost:5000` 的 API：

| Hook | API 端点 |
|---|---|
| `useSignals` | `GET /api/signals` |
| `usePositions` | `GET /api/positions` |
| `useForum` | `GET /api/forum/log` |
| `useSettings` | `GET /api/config` |
| `sendMcpCommand` | `POST /api/mcp` |

---

## 配置说明

所有配置通过 `.env` 管理：

| 变量 | 说明 | 默认值 |
|---|---|---|
| `HOST` | Flask 监听地址 | `0.0.0.0` |
| `PORT` | Flask 端口 | `5000` |
| `FLASK_SECRET_KEY` | Flask 会话密钥（生产环境必须设置） | — |
| `ENV` | 运行环境：`development` 或 `production` | `development` |
| `ADMIN_API_KEY` | 管理后台 API Key，保护敏感端点 | — |
| `PUBLIC_READ_ACCESS` | 是否允许匿名只读访问（GET/HEAD） | `false` |
| `KEY_STORAGE_BACKEND` | 私钥存储后端：`keyring` 或 `encrypted_file` | `keyring` |
| `KEY_FILE_PASSWORD` | `encrypted_file` 后端的加密密码 | — |
| `KEY_FILE_PATH` | 加密文件路径（默认 `~/.oracleforge/key.enc`） | — |
| `SIGNAL_ENGINE_API_KEY` | 信号解析 LLM API Key | — |
| `SIGNAL_ENGINE_BASE_URL` | 信号解析 LLM Base URL | `https://api.openai.com/v1` |
| `SIGNAL_ENGINE_MODEL_NAME` | 信号解析模型 | `gpt-4o-mini` |
| `FORUM_HOST_API_KEY` | 论坛主持 LLM API Key | — |
| `FORUM_HOST_BASE_URL` | 论坛主持 LLM Base URL | — |
| `FORUM_HOST_MODEL_NAME` | 论坛主持模型 | — |
| `TWITTER_BEARER_TOKEN` | Twitter API v2 Bearer Token | — |
| `REDDIT_CLIENT_ID` | Reddit app client ID | — |
| `REDDIT_CLIENT_SECRET` | Reddit app client secret | — |
| `COINGECKO_API_KEY` | CoinGecko Pro API Key | — |
| `TRADING_ASSETS` | 交易资产列表，逗号分隔 | `INJ` |
| `INJECTIVE_NETWORK` | `testnet` 或 `mainnet` | `testnet` |
| `INJECTIVE_PRIVATE_KEY` | ⚠️ **已废弃**，请用 `utils/key_manager.py` 导入 | — |
| `INJECTIVE_MOCK` | `true`=不真正上链 | `true` |
| `TOTAL_CAPITAL_USD` | 总资金 | `10000` |
| `MAX_POSITION_PCT` | 单笔最大仓位比例 | `0.05` |
| `MAX_DAILY_LOSS_PCT` | 日内亏损上限 | `0.02` |
| `MAX_LEVERAGE` | 最大杠杆 | `3` |
| `RISK_PROFILE` | `conservative`/`medium`/`aggressive` | `medium` |

---

## API 参考

| 端点 | 方法 | 说明 |
|---|---|---|
| `GET /` | GET | API 状态页（提示使用 Next.js 前端） |
| `/api/system/start` | POST | 启动 Agent 与信号循环（需 `X-API-Key`） |
| `/api/system/stop` | POST | 停止系统（需 `X-API-Key`） |
| `/api/system/status` | GET | 信号循环运行状态 |
| `/api/system/errors` | GET | 最近 loop 错误日志 |
| `/api/signals` | GET | 最近信号 |
| `/api/signals/<id>/result` | POST | 标记信号结果（TP/SL/EXPIRED，需 `X-API-Key`） |
| `/api/positions` | GET | 当前 Injective 持仓 |
| `/api/forum/log` | GET | 论坛辩论日志 |
| `/api/mcp` | POST | 自然语言交易指令（需 `X-API-Key`） |
| `/api/config` | GET | 当前系统配置（前端设置页用） |

**MCP 示例：**

```bash
curl -X POST http://localhost:5000/api/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $ADMIN_API_KEY" \
  -d '{"text": "Buy 5% INJ 2x", "price": 25.0}'
```

> 当 `ADMIN_API_KEY` 已配置时，所有敏感端点（`POST /api/system/start`、`POST /api/system/stop`、`POST /api/mcp`、`POST /api/signals/<id>/result`）都需要在请求头中携带 `X-API-Key`。
> 只读端点（`GET /api/signals`、`GET /api/positions` 等）默认需要认证；设置 `PUBLIC_READ_ACCESS=true` 可允许匿名访问。

---

## 项目结构

```
oracleforge/
├── nova_app.py              # Flask 主程序（API-only）
├── config.py                # Pydantic Settings
├── .env.example             # 环境变量模板
├── requirements.txt         # Python 依赖
│
├── SocialSentinel/          # 社媒情绪采集
├── OnChainSentinel/         # 链上数据采集
├── MacroSentinel/           # 宏观事件采集
│
├── ForumEngine/             # Agent 辩论引擎
│   ├── debate.py            # Bull/Bear 两回合辩论
│   ├── monitor.py           # 论坛日志监控
│   └── llm_host.py          # Forum Host LLM
│
├── SignalEngine/
│   ├── schema.py            # TradingSignal 数据模型
│   ├── parser.py            # 论坛文本 → JSON
│   ├── db.py                # SQLite 持久化
│   └── memory.py            # 交易员记忆
│
├── RiskManager/
│   ├── risk_manager.py      # 仓位 + 日内亏损保护
│   └── committee.py         # 三委员投票
│
├── InjectiveExecutor/
│   ├── executor.py          # iAgent SDK 执行
│   └── mcp_interface.py     # 自然语言指令解析
│
├── web/                     # Next.js 16 前端（Node.js，唯一正式 UI）
│   ├── src/app/             # 页面路由
│   ├── src/components/      # 组件
│   ├── src/hooks/useData.ts # 后端 API hooks
│   ├── src/lib/api.ts       # API 客户端
│   ├── src/lib/mock.ts      # Mock 数据
│   └── package.json
│
└── tests/                   # 单元测试 + 集成测试
```

---

## 前端页面

| 页面 | 路径 | 功能 |
|---|---|---|
| 仪表盘 | `/` | 价格、统计、最近信号、快速交易、信号时间线 |
| AI 交易助手 | `/chat` | 自然语言交易指令与问答 |
| 论坛辩论 | `/forum` | 多 Agent 辩论展示 |
| 持仓与历史 | `/portfolio` | 当前持仓、历史交易、信号历史 |
| 信息源 | `/sources` | 情绪热力图、信息源筛选 |
| 系统设置 | `/settings` | LLM、风险、数据源、Injective、信号频率配置 |

---

## 信号流程

```
1. 三个 Sentinel 并行采集市场情报
2. ForumEngine 进行 Bull vs Bear 两回合辩论
3. Trader Agent 综合辩论结果输出方向/置信度/理由
4. RiskManager + RiskCommittee 审核仓位与风险
5. InjectiveExecutor 在链上执行（mock 或真实）
6. SQLite 持久化信号，SocketIO 推送前端
```

---

## 开发提示

### 前端热更新卡住？

```bash
cd web
rm -rf .next
npm run dev
```

### 后端端口 5000 被占用？

```bash
lsof -ti:5000 | xargs kill -9
python nova_app.py
```

### 前端端口 3001 被占用？

```bash
cd web
npm run dev -- --port 3002
```

### 重置数据库

```bash
rm -f signals.db
python nova_app.py
```

---

## 迁移说明

### 从旧版 `.env` 迁移

如果你之前把 `INJECTIVE_PRIVATE_KEY` 写在 `.env` 里，请按以下步骤迁移：

1. 安装新依赖：
   ```bash
   pip install -r requirements.txt
   ```

2. 把私钥导入安全存储：
   ```bash
   python -m utils.key_manager import --key $INJECTIVE_PRIVATE_KEY
   ```

3. 从 `.env` 中删除 `INJECTIVE_PRIVATE_KEY` 这一行，并清空 shell history：
   ```bash
   history -c  # 或在 ~/.zsh_history 中手动删除相关行
   ```

4. 添加新的安全配置：
   ```bash
   FLASK_SECRET_KEY=$(openssl rand -hex 32)
   ADMIN_API_KEY=$(openssl rand -hex 32)
   ```

5. 重启后端。

---

## 测试

```bash
pytest tests/
```

---

## 协议

MIT — 详见 [LICENSE](LICENSE)

---

<p align="center">
  在 Injective 上用心构建
</p>
