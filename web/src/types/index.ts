export type Asset = "INJ" | "BTC" | "ETH" | "SOL" | "AVAX";

export type Direction = "LONG" | "SHORT" | "NEUTRAL";

export type AgentRole = "Social" | "OnChain" | "Macro" | "Host";

export type ConsensusTag = "HIGH_CONSENSUS" | "CONFLICT" | "INVESTIGATE" | "NEUTRAL";

export interface Signal {
  id: string;
  asset: Asset;
  direction: Direction;
  confidence: number;
  entryRange: [number, number];
  stopLoss?: number;
  takeProfit?: number;
  reasoning: string;
  consensusTag: ConsensusTag;
  createdAt: string;
  result?: "HIT_TP" | "HIT_SL" | "EXPIRED" | "PENDING";
  txHash?: string;
}

export interface Position {
  id: string;
  asset: Asset;
  direction: Direction;
  leverage: number;
  entryPrice: number;
  currentPrice: number;
  size: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface Trade {
  id: string;
  asset: Asset;
  direction: Direction;
  entryPrice: number;
  exitPrice: number;
  leverage: number;
  size: number;
  pnl: number;
  pnlPercent: number;
  exitReason: "TP" | "SL" | "MANUAL" | "LIQUIDATED";
  closedAt: string;
}

export interface ForumMessage {
  id: string;
  role: AgentRole;
  content: string;
  confidence?: number;
  sentiment?: "BULLISH" | "BEARISH" | "NEUTRAL";
  evidence?: string[];
  round?: number;
  timestamp: string;
  consensusTag?: ConsensusTag;
}

export interface DataSourceItem {
  id: string;
  source: "Twitter" | "Reddit" | "CryptoPanic" | "Glassnode" | "OnChain" | "Macro";
  content: string;
  url?: string;
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  influence: number;
  confidence: number;
  timestamp: string;
  asset?: Asset;
}

export interface AgentStatusInfo {
  role: AgentRole;
  online: boolean;
  lastHeartbeat: string;
  currentTask?: string;
}

export interface RiskConfig {
  totalCapital: number;
  maxPositionPercent: number;
  maxDailyLoss: number;
  leverageLimit: number;
}

export interface LLMConfig {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface SettingsState {
  llm: Record<AgentRole | "default", LLMConfig>;
  risk: RiskConfig;
  dataSources: {
    twitterApiKey?: string;
    redditApiKey?: string;
    coingeckoApiKey?: string;
  };
  injective: {
    network: "testnet" | "mainnet";
    privateKey?: string;
    mock: boolean;
  };
  forumIntervalMinutes: number;
}
