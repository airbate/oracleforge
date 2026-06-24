"use client";

import { useState } from "react";
import PositionCard from "@/components/PositionCard";
import SignalCard from "@/components/SignalCard";
import { mockPositions, mockTrades, mockSignals } from "@/lib/mock";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const tabs = ["当前持仓", "历史交易", "信号历史"];

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState("当前持仓");

  const totalPnl = mockPositions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
  const closedPnl = mockTrades.reduce((sum, t) => sum + t.pnl, 0);

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 flex h-[50px] items-center border-b border-black/5 bg-white/80 px-4 backdrop-blur-sm">
        <span className="text-base font-bold text-black/90">持仓与历史</span>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* PnL summary */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-black/[0.08] bg-white p-4">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-black/50">未实现盈亏</div>
            <div className={`text-2xl font-bold ${totalPnl >= 0 ? "text-[#16c456]" : "text-[#ff3849]"}`}>
              {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
            </div>
          </div>
          <div className="rounded-2xl border border-black/[0.08] bg-white p-4">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-black/50">已实现盈亏</div>
            <div className={`text-2xl font-bold ${closedPnl >= 0 ? "text-[#16c456]" : "text-[#ff3849]"}`}>
              {closedPnl >= 0 ? "+" : ""}${closedPnl.toFixed(2)}
            </div>
          </div>
          <div className="rounded-2xl border border-black/[0.08] bg-white p-4">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-black/50">胜率</div>
            <div className="text-2xl font-bold text-black/90">62.5%</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex items-center gap-1 rounded-xl bg-black/[0.03] p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                activeTab === tab
                  ? "bg-white text-black/90 shadow-sm"
                  : "text-black/50 hover:text-black/70"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-3">
          {activeTab === "当前持仓" && (
            mockPositions.length > 0 ? (
              mockPositions.map((position) => <PositionCard key={position.id} position={position} />)
            ) : (
              <div className="py-12 text-center text-sm text-black/40">暂无持仓</div>
            )
          )}

          {activeTab === "历史交易" && (
            <div className="rounded-2xl border border-black/[0.08] bg-white">
              <div className="grid grid-cols-6 gap-4 border-b border-black/[0.06] px-4 py-3 text-xs font-medium text-black/50">
                <span>资产</span>
                <span>方向</span>
                <span>入场/出场</span>
                <span>杠杆</span>
                <span>盈亏</span>
                <span>原因</span>
              </div>
              {mockTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="grid grid-cols-6 gap-4 px-4 py-3 text-sm transition-colors hover:bg-black/[0.02]"
                >
                  <span className="font-medium text-black/90">{trade.asset}</span>
                  <span
                    className={cn(
                      "flex items-center gap-0.5 text-xs font-bold",
                      trade.direction === "LONG" ? "text-[#16c456]" : "text-[#ff3849]"
                    )}
                  >
                    {trade.direction === "LONG" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {trade.direction}
                  </span>
                  <span className="text-black/70">
                    {trade.entryPrice.toFixed(2)} / {trade.exitPrice.toFixed(2)}
                  </span>
                  <span className="text-black/70">{trade.leverage}x</span>
                  <span
                    className={cn(
                      "font-medium",
                      trade.pnl >= 0 ? "text-[#16c456]" : "text-[#ff3849]"
                    )}
                  >
                    {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                  </span>
                  <span className="text-xs text-black/50">{trade.exitReason}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === "信号历史" && mockSignals.map((signal) => <SignalCard key={signal.id} signal={signal} />)}
        </div>
      </div>
    </div>
  );
}
