import { ArrowUpRight, ArrowDownRight, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Position } from "@/types";

interface PositionCardProps {
  position: Position;
}

export default function PositionCard({ position }: PositionCardProps) {
  const isLong = position.direction === "LONG";
  const isProfit = position.unrealizedPnl >= 0;

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white p-4 transition-shadow hover:shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-black/90">{position.asset}</span>
          <span
            className={cn(
              "flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-bold",
              isLong ? "bg-[#16c456]/10 text-[#16c456]" : "bg-[#ff3849]/10 text-[#ff3849]"
            )}
          >
            {isLong ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {position.direction} {position.leverage}x
          </span>
        </div>
        <div className={cn("text-sm font-bold", isProfit ? "text-[#16c456]" : "text-[#ff3849]")}>
          {isProfit ? "+" : ""}
          {position.unrealizedPnl.toFixed(2)} ({isProfit ? "+" : ""}
          {position.unrealizedPnlPercent.toFixed(2)}%)
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <div>
          <div className="mb-0.5 text-black/50">开仓价</div>
          <div className="font-medium text-black/90">{position.entryPrice.toFixed(2)}</div>
        </div>
        <div>
          <div className="mb-0.5 text-black/50">当前价</div>
          <div className="font-medium text-black/90">{position.currentPrice.toFixed(2)}</div>
        </div>
        <div>
          <div className="mb-0.5 text-black/50">仓位</div>
          <div className="font-medium text-black/90">{position.size.toFixed(4)}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-black/60">
        {position.stopLoss && (
          <span className="flex items-center gap-1">
            <Target size={10} /> SL {position.stopLoss.toFixed(2)}
          </span>
        )}
        {position.takeProfit && (
          <span className="flex items-center gap-1">TP {position.takeProfit.toFixed(2)}</span>
        )}
      </div>
    </div>
  );
}
