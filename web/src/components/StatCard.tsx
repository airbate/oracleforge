import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
}

export default function StatCard({ label, value, change, changeType = "neutral", icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-black/[0.08] bg-white p-4 transition-shadow hover:shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-black/50">{label}</span>
        {icon && <span className="text-black/40">{icon}</span>}
      </div>
      <div className="text-[22px] font-bold text-black/90">{value}</div>
      {change && (
        <div
          className={cn(
            "mt-1 text-xs font-medium",
            changeType === "positive" && "text-[#16c456]",
            changeType === "negative" && "text-[#ff3849]",
            changeType === "neutral" && "text-black/50"
          )}
        >
          {change}
        </div>
      )}
    </div>
  );
}
