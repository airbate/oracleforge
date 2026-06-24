"use client";

interface TimeProps {
  date: string | Date;
  className?: string;
  options?: Intl.DateTimeFormatOptions;
}

export default function Time({ date, className = "", options }: TimeProps) {
  const d = typeof date === "string" ? new Date(date) : date;
  return (
    <span className={className} suppressHydrationWarning>
      {d.toLocaleTimeString("zh-CN", options)}
    </span>
  );
}
