"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Radio,
  MessagesSquare,
  LineChart,
  Settings,
  PanelLeft,
  ChevronLeft,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "仪表盘", href: "/", icon: LayoutDashboard },
  { label: "AI 交易", href: "/chat", icon: MessageSquare },
  { label: "信息源", href: "/sources", icon: Radio },
  { label: "论坛", href: "/forum", icon: MessagesSquare },
  { label: "持仓", href: "/portfolio", icon: LineChart },
  { label: "设置", href: "/settings", icon: Settings },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export default function Sidebar() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);

  const visible = isMobile ? false : !collapsed;

  return (
    <>
      {/* Mobile hamburger */}
      {isMobile && (
        <button
          className="fixed left-4 top-4 z-[30] flex h-8 w-8 items-center justify-center rounded-lg text-black/60 hover:bg-black/5"
          onClick={() => setCollapsed(false)}
          aria-label="展开导航"
        >
          <PanelLeft size={20} />
        </button>
      )}

      {/* Mobile backdrop */}
      {isMobile && visible && (
        <div
          className="fixed inset-0 z-[20] bg-black/20"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 z-[25] flex h-screen flex-col bg-[#f9fbfc] transition-transform duration-300 ease-in-out"
        style={{
          width: 240,
          transform: visible ? "translateX(0)" : "translateX(-240px)",
          boxShadow: visible && isMobile ? "2px 0 8px rgba(0,0,0,0.08)" : "none",
        }}
      >
        {/* Logo header */}
        <div className="flex h-14 items-center justify-between px-4 pb-[9px] pt-[15px]">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-black/90 no-underline">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1783ff] text-white">
              <Zap size={16} fill="currentColor" />
            </span>
            OracleForge
          </Link>
          {!isMobile && (
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg text-black/45 hover:bg-black/5"
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? "展开" : "收起"}
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* New signal / chat button */}
        <div className="px-3 pt-1">
          <Link
            href="/chat"
            className="flex items-center justify-center gap-2 rounded-xl border border-black/[0.13] bg-white px-3 py-2.5 text-sm font-medium text-black/90 transition-all hover:bg-black/[0.02] hover:shadow-sm"
          >
            <MessageSquare size={16} />
            新建交易对话
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[#1783ff]/10 text-[#1783ff]"
                    : "text-black/80 hover:bg-black/5 hover:text-black/90"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer hint */}
        <div className="px-4 py-3 text-xs text-black/40">
          AI 原生情绪驱动交易信号引擎
        </div>
      </aside>
    </>
  );
}
