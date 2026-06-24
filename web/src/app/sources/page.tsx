"use client";

import { useState } from "react";
import DataSourceCard from "@/components/DataSourceCard";
import { mockDataSources } from "@/lib/mock";
import type { DataSourceItem } from "@/types";
import { Filter, SlidersHorizontal } from "lucide-react";

const filters = ["全部", "Social", "OnChain", "Macro"];
const sentiments = ["全部", "看涨", "看跌", "中性"];

export default function SourcesPage() {
  const [sourceFilter, setSourceFilter] = useState("全部");
  const [sentimentFilter, setSentimentFilter] = useState("全部");

  const filtered = mockDataSources.filter((item) => {
    const matchSource = sourceFilter === "全部" || item.source === sourceFilter;
    const sentimentMap: Record<string, string> = {
      看涨: "BULLISH",
      看跌: "BEARISH",
      中性: "NEUTRAL",
    };
    const matchSentiment =
      sentimentFilter === "全部" || item.sentiment === sentimentMap[sentimentFilter];
    return matchSource && matchSentiment;
  });

  const bullish = mockDataSources.filter((d) => d.sentiment === "BULLISH").length;
  const bearish = mockDataSources.filter((d) => d.sentiment === "BEARISH").length;
  const neutral = mockDataSources.filter((d) => d.sentiment === "NEUTRAL").length;
  const total = bullish + bearish + neutral;

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 flex h-[50px] items-center border-b border-black/5 bg-white/80 px-4 backdrop-blur-sm">
        <span className="text-base font-bold text-black/90">信息源</span>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Sentiment heatmap */}
        <div className="mb-6 rounded-2xl border border-black/[0.08] bg-white p-4">
          <div className="mb-3 text-sm font-bold text-black/90">情绪热力图</div>
          <div className="flex h-8 overflow-hidden rounded-full">
            <div
              className="flex items-center justify-center bg-[#16c456] text-[10px] font-bold text-white"
              style={{ width: `${(bullish / total) * 100}%` }}
            >
              {bullish}
            </div>
            <div
              className="flex items-center justify-center bg-[#ffd230] text-[10px] font-bold text-black/70"
              style={{ width: `${(neutral / total) * 100}%` }}
            >
              {neutral}
            </div>
            <div
              className="flex items-center justify-center bg-[#ff3849] text-[10px] font-bold text-white"
              style={{ width: `${(bearish / total) * 100}%` }}
            >
              {bearish}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-black/50">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#16c456]" /> 看涨 {bullish}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#ffd230]" /> 中性 {neutral}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#ff3849]" /> 看跌 {bearish}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-black/50">
              <Filter size={12} className="inline" /> 来源
            </span>
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setSourceFilter(f)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  sourceFilter === f
                    ? "bg-[#1783ff] text-white"
                    : "border border-black/[0.08] bg-white text-black/70 hover:bg-black/[0.03]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-black/50">
              <SlidersHorizontal size={12} className="inline" /> 情绪
            </span>
            {sentiments.map((s) => (
              <button
                key={s}
                onClick={() => setSentimentFilter(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  sentimentFilter === s
                    ? "bg-[#1783ff] text-white"
                    : "border border-black/[0.08] bg-white text-black/70 hover:bg-black/[0.03]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((item) => (
            <DataSourceCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
