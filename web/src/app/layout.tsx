import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import AgentStatus from "@/components/AgentStatus";

export const metadata: Metadata = {
  title: "OracleForge - AI 原生情绪驱动交易信号引擎",
  description: "OracleForge：Social / OnChain / Macro 三个 Agent 实时辩论，生成 Injective 链上交易信号。",
  icons: {
    icon: "/seo/favicon.ico",
    shortcut: "/seo/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="h-full overflow-hidden antialiased">
        <div className="relative h-screen w-screen min-w-[320px] overflow-hidden bg-[#f9fbfc]">
          <Sidebar />

          <main className="absolute bottom-[6px] right-[6px] top-[6px] flex overflow-hidden rounded-lg border border-black/5 bg-white left-[6px] md:left-[240px]">
            <div className="relative flex h-full w-full flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                {children}
              </div>
              <AgentStatus />
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
