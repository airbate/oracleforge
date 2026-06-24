"use client";

import { useState } from "react";
import ForumMessageCard from "@/components/ForumMessageCard";
import { mockForumMessages } from "@/lib/mock";
import { MessageSquare, Sparkles } from "lucide-react";

export default function ForumPage() {
  const [round, setRound] = useState(12);

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 flex h-[50px] items-center justify-between border-b border-black/5 bg-white/80 px-4 backdrop-blur-sm">
        <span className="text-base font-bold text-black/90">论坛辩论</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-black/50">当前轮次</span>
          <span className="rounded-lg bg-black/[0.06] px-2 py-1 text-xs font-bold text-black/80">
            第 {round} 轮
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {/* Round separator */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-black/[0.08]" />
            <span className="text-xs font-medium text-black/40">第 {round} 轮 · 5 分钟前</span>
            <div className="h-px flex-1 bg-black/[0.08]" />
          </div>

          {mockForumMessages.map((msg) => (
            <ForumMessageCard key={msg.id} message={msg} />
          ))}

          {/* Suggested action */}
          <div className="rounded-xl border border-[#1783ff]/20 bg-[#1783ff]/[0.03] p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#1783ff]">
              <Sparkles size={16} />
              Host 建议
            </div>
            <div className="text-sm text-black/70">
              三方对 INJ 看法存在分歧，Social/OnChain 偏多，Macro 提示非农数据风险。建议等待数据公布后再开仓，或降低仓位。
            </div>
            <div className="mt-3 flex gap-2">
              <button className="rounded-lg bg-[#1783ff] px-3 py-1.5 text-xs font-medium text-white">
                发起调查
              </button>
              <button className="rounded-lg border border-black/[0.13] bg-white px-3 py-1.5 text-xs font-medium text-black/70">
                继续观察
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
