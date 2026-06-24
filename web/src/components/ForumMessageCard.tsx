import Time from "@/components/Time";
import { cn } from "@/lib/utils";
import type { ForumMessage } from "@/types";

interface ForumMessageProps {
  message: ForumMessage;
}

const roleConfig = {
  Social: { color: "#1783ff", label: "Social" },
  OnChain: { color: "#16c456", label: "OnChain" },
  Macro: { color: "#ffd230", label: "Macro" },
  Host: { color: "#985ffb", label: "Host" },
};

export default function ForumMessageCard({ message }: ForumMessageProps) {
  const config = roleConfig[message.role];
  const isHost = message.role === "Host";

  return (
    <div
      className={cn(
        "rounded-xl border-l-[3px] bg-white p-3 transition-shadow hover:shadow-sm",
        message.consensusTag === "HIGH_CONSENSUS" && "border-l-[#16c456] bg-[#16c456]/[0.03]",
        message.consensusTag === "CONFLICT" && "border-l-[#ff3849] bg-[#ff3849]/[0.03]",
        message.consensusTag === "INVESTIGATE" && "border-l-[#ffd230] bg-[#ffd230]/[0.03]",
        !message.consensusTag && "border-l-transparent"
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: config.color }}
          >
            {config.label[0]}
          </span>
          <span className="text-sm font-bold text-black/90">{config.label}</span>
          {message.sentiment && (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-bold",
                message.sentiment === "BULLISH" && "bg-[#16c456]/10 text-[#16c456]",
                message.sentiment === "BEARISH" && "bg-[#ff3849]/10 text-[#ff3849]",
                message.sentiment === "NEUTRAL" && "bg-black/5 text-black/50"
              )}
            >
              {message.sentiment}
            </span>
          )}
        </div>
        <span className="text-xs text-black/40">
          {message.round && `第 ${message.round} 轮 · `}
          <Time date={message.timestamp} options={{ hour: "2-digit", minute: "2-digit" }} />
        </span>
      </div>

      <div className={cn("text-sm leading-relaxed", isHost ? "font-medium text-black/90" : "text-black/70")}>
        {message.content}
      </div>

      {message.evidence && message.evidence.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {message.evidence.map((ev, i) => (
            <span key={i} className="rounded bg-black/[0.05] px-2 py-0.5 text-[11px] text-black/60">
              {ev}
            </span>
          ))}
        </div>
      )}

      {message.confidence !== undefined && (
        <div className="mt-2">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-black/50">置信度</span>
            <span className="font-medium text-black/80">{message.confidence}%</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-black/[0.08]">
            <div
              className="h-full rounded-full bg-[#1783ff]"
              style={{ width: `${message.confidence}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
