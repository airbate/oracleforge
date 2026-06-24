# OracleForge Web Frontend

基于 Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui 构建的交易仪表盘前端。

## 开发

```bash
cd web
npm install
npm run dev
```

打开 http://localhost:3000。

## 构建

```bash
npm run build
```

## 页面

- `/` — 仪表盘
- `/chat` — AI 交易聊天
- `/sources` — 信息源
- `/forum` — 论坛辩论
- `/portfolio` — 持仓与历史
- `/settings` — 系统设置

## 后端集成

默认使用 `src/lib/mock.ts` 中的模拟数据。要连接 Flask 后端，设置环境变量：

```bash
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_BASE=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```
