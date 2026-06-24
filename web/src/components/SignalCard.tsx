import { ArrowUpRight, ArrowDownRight, Target, Shield } from "lucide-react";
import Time from "@/components/Time";
import { cn } from "@/lib/utils";
import type { Signal } from "@/types";

interface SignalCardProps {
  signal: Signal;
}

export default function SignalCard({ signal }: SignalCardProps) {
  const isLong = signal.direction === "LONG";
  const isShort = signal.direction === "SHORT";

  return (
    <div className={cn(
      "rounded-lg border-l-[3px] bg-[#0d1425]/[0.03] p-3 transition-colors hover:bg-black/[0.05]",
      isLong && "border-l-[#16c456]",
      isShort && "border-l-[#ff3849]",
      signal.direction === "NEUTRAL" && "border-l-black/30"
    )}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-black/90">{signal.asset}</span>
          <span
            className={cn(
              "flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-bold",
              isLong && "bg-[#16c456]/10 text-[#16c456]",
              isShort && "bg-[#ff3849]/10 text-[#ff3849]",
              signal.direction === "NEUTRAL" && "bg-black/5 text-black/50"
            )}
          >
            {isLong && <ArrowUpRight size={10} />}
            {isShort && <ArrowDownRight size={10} />}
            {signal.direction}
          </span>
        </div>
        <Time date={signal.createdAt} options={{ hour: "2-digit", minute: "2-digit" }} className="text-xs text-black/40" />
      </div>

      <div className="mb-2 text-sm text-black/70 line-clamp-2">{signal.reasoning}</div>

      <div className="mb-2">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-black/50">置信度</span>
          <span className="font-medium text-black/80">{signal.confidence}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.08]">
          <div
            className={cn(
              "h-full rounded-full",
              isLong ? "bg-[#16c456]" : isShort ? "bg-[#ff3849]" : "bg-black/40"
            )}
            style={{ width: `${signal.confidence}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-black/60">
        <span className="flex items-center gap-1">
          <Target size={10} /> 入场 {signal.entryRange[0]}–{signal.entryRange[1]}
        </span>
        {signal.stopLoss && (
          <span className="flex items-center gap-1">
            <Shield size={10} /> SL {signal.stopLoss}
          </span>
        )}
        {signal.takeProfit && (
          <span className="flex items-center gap-1">
            TP {signal.takeProfit}
          </span>
        )}
      </div>
    </div>
  );
}
