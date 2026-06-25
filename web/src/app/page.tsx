"use client";

import { useState } from "react";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import SignalCard from "@/components/SignalCard";
import RiskProgress from "@/components/RiskProgress";
import ChatEditor from "@/components/ChatEditor";
import Time from "@/components/Time";
import { useSignals } from "@/hooks/useData";
import { mockPrices } from "@/lib/mock";
import type { Asset } from "@/types";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [activeAsset, setActiveAsset] = useState<Asset>("INJ");
  const { data: signals, loading } = useSignals();
  const price = mockPrices[activeAsset];

  const assetSignals = signals.filter((s) => s.asset === activeAsset);

  return (
    <div className="flex min-h-full flex-col">
      <Header activeAsset={activeAsset} onAssetChange={setActiveAsset} />

      <div className="flex-1 p-4 md:p-6">
        {/* Price ticker */}
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="text-sm text-black/50">{activeAsset}/USD 当前价格</div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-black/90">${price.price.toLocaleString()}</span>
              <span
                className={`text-sm font-medium ${
                  price.change24h >= 0 ? "text-[#16c456]" : "text-[#ff3849]"
                }`}
              >
                {price.change24h >= 0 ? "+" : ""}
                {price.change24h}% · 24h
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-black/50">24h 成交量</div>
            <div className="text-base font-medium text-black/80">${(price.volume24h / 1e6).toFixed(1)}M</div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
          <StatCard label="总信号" value={signals.length} change="+12 本周" changeType="positive" icon={<Activity size={16} />} />
          <StatCard label="胜率" value="62.5%" change="+3.2%" changeType="positive" icon={<BarChart3 size={16} />} />
          <StatCard label="累计盈亏" value="+$4,281" change="+18.4%" changeType="positive" icon={<TrendingUp size={16} />} />
          <StatCard label="运行时长" value="14d 6h" change="稳定" changeType="neutral" icon={<MessageSquare size={16} />} />
          <StatCard label="当前持仓" value="2" change="1 多 1 空" changeType="neutral" icon={<TrendingDown size={16} />} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            {/* Risk progress */}
            <RiskProgress current={142.5} limit={500} />

            {/* Recent signals */}
            <div className="rounded-2xl border border-black/[0.08] bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-base font-bold text-black/90">最近信号 · {activeAsset}</span>
                <Link
                  href="/portfolio"
                  className="flex items-center gap-1 text-sm font-medium text-[#1783ff] hover:underline"
                >
                  全部信号
                  <ArrowRight size={14} />
                </Link>
              </div>
              <div className="space-y-3">
                {loading ? (
                  <div className="py-8 text-center text-sm text-black/40">加载中...</div>
                ) : assetSignals.length > 0 ? (
                  assetSignals.map((signal) => <SignalCard key={signal.id} signal={signal} />)
                ) : (
                  <div className="py-8 text-center text-sm text-black/40">暂无 {activeAsset} 信号</div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Quick chat */}
            <div className="rounded-2xl border border-black/[0.08] bg-white p-4">
              <div className="mb-3 text-base font-bold text-black/90">快速交易</div>
              <ChatEditor
                placeholder={`输入指令，例如：做多 ${activeAsset} 2x`}
                quickActions={[`做多 ${activeAsset}`, `做空 ${activeAsset}`, "查询持仓", "全部平仓"]}
                showQuickActions
              />
            </div>

            {/* Signal timeline */}
            <div className="rounded-2xl border border-black/[0.08] bg-white p-4">
              <div className="mb-4 text-base font-bold text-black/90">信号时间线</div>
              <div className="space-y-4">
                {loading ? (
                  <div className="py-4 text-center text-sm text-black/40">加载中...</div>
                ) : (
                  signals.slice(0, 4).map((signal) => (
                    <div key={signal.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            signal.direction === "LONG"
                              ? "bg-[#16c456]"
                              : signal.direction === "SHORT"
                              ? "bg-[#ff3849]"
                              : "bg-black/30"
                          }`}
                        />
                        <div className="mt-1 h-full w-px bg-black/[0.08]" />
                      </div>
                      <div className="pb-4">
                        <Time
                          date={signal.createdAt}
                          options={{ hour: "2-digit", minute: "2-digit" }}
                          className="text-xs text-black/40"
                        />
                        <div className="text-sm font-medium text-black/90">
                          {signal.asset} {signal.direction} · 置信度 {signal.confidence}%
                        </div>
                        <div className="text-xs text-black/50 line-clamp-1">{signal.reasoning}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
