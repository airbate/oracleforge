import { TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import Time from "@/components/Time";
import { cn } from "@/lib/utils";
import type { DataSourceItem } from "@/types";

interface DataSourceCardProps {
  item: DataSourceItem;
}

const sourceConfig = {
  Twitter: { color: "#1783ff", label: "Twitter" },
  Reddit: { color: "#ff4500", label: "Reddit" },
  CryptoPanic: { color: "#ffd230", label: "CryptoPanic" },
  Glassnode: { color: "#16c456", label: "Glassnode" },
  OnChain: { color: "#16c456", label: "OnChain" },
  Macro: { color: "#985ffb", label: "Macro" },
};

export default function DataSourceCard({ item }: DataSourceCardProps) {
  const config = sourceConfig[item.source];

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white p-4 transition-shadow hover:shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="rounded px-1.5 py-0.5 text-[11px] font-bold text-white"
            style={{ backgroundColor: config.color }}
          >
            {config.label}
          </span>
          {item.asset && (
            <span className="text-xs font-medium text-black/60">{item.asset}</span>
          )}
        </div>
        <Time date={item.timestamp} className="text-xs text-black/40" />
      </div>

      <div className="mb-3 text-sm leading-relaxed text-black/80">{item.content}</div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              item.sentiment === "BULLISH" && "text-[#16c456]",
              item.sentiment === "BEARISH" && "text-[#ff3849]",
              item.sentiment === "NEUTRAL" && "text-black/50"
            )}
          >
            {item.sentiment === "BULLISH" && <TrendingUp size={12} />}
            {item.sentiment === "BEARISH" && <TrendingDown size={12} />}
            {item.sentiment === "NEUTRAL" && <Minus size={12} />}
            {item.sentiment}
          </span>
          <span className="text-xs text-black/40">影响力 {item.influence}/10</span>
          <span className="text-xs text-black/40">置信度 {item.confidence}%</span>
        </div>
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-black/40 hover:text-[#1783ff]"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
}
