"use client";

import { cn } from "@/lib/utils";
import type { Asset } from "@/types";

interface HeaderProps {
  assets?: Asset[];
  activeAsset?: Asset;
  onAssetChange?: (asset: Asset) => void;
  live?: boolean;
}

const defaultAssets: Asset[] = ["INJ", "BTC", "ETH", "SOL", "AVAX"];

export default function Header({
  assets = defaultAssets,
  activeAsset = "INJ",
  onAssetChange,
  live = true,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-[50px] items-center justify-between border-b border-black/5 bg-white/80 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-1">
        {assets.map((asset) => (
          <button
            key={asset}
            onClick={() => onAssetChange?.(asset)}
            className={cn(
              "rounded-lg px-3 py-1 text-sm font-medium transition-colors",
              activeAsset === asset
                ? "bg-black/[0.06] text-black/90"
                : "text-black/50 hover:bg-black/[0.03] hover:text-black/70"
            )}
          >
            {asset}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", live ? "bg-[#16c456]" : "bg-black/20")} />
        <span className="text-xs font-medium text-black/70">{live ? "Live" : "Offline"}</span>
      </div>
    </header>
  );
}
