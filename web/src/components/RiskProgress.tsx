import { cn } from "@/lib/utils";

interface RiskProgressProps {
  current: number;
  limit: number;
  label?: string;
}

export default function RiskProgress({ current, limit, label = "日亏损进度" }: RiskProgressProps) {
  const percent = Math.min(100, Math.max(0, (current / limit) * 100));
  const isWarning = percent >= 70;
  const isDanger = percent >= 90;

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-black/80">{label}</span>
        <span className={cn("text-sm font-bold", isDanger ? "text-[#ff3849]" : isWarning ? "text-[#ffd230]" : "text-black/70")}>
          {current.toFixed(2)} / {limit.toFixed(2)} ({percent.toFixed(1)}%)
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-black/[0.08]">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isDanger ? "bg-[#ff3849]" : isWarning ? "bg-[#ffd230]" : "bg-[#16c456]"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      {isDanger && (
        <div className="mt-2 text-xs font-medium text-[#ff3849]">
          接近日亏损上限，系统已限制新开仓
        </div>
      )}
    </div>
  );
}
