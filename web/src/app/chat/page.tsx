"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, User, CheckCircle2, XCircle, ArrowUp } from "lucide-react";
import ChatEditor from "@/components/ChatEditor";
import Time from "@/components/Time";
import { cn } from "@/lib/utils";

type MessageType = "user" | "ai" | "system" | "result" | "error";

interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: string;
  meta?: {
    asset?: string;
    direction?: string;
    leverage?: number;
    size?: string;
  };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "ai",
      content: "你好，我是 OracleForge 交易助手。你可以问我市场观点，或直接输入交易指令，例如：\n\n• 做多 INJ 2x\n• 查询持仓\n• 全部平仓",
      timestamp: new Date().toISOString(),
    },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text: string) => {
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      type: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    let aiMsg: ChatMessage;
    if (text.includes("做多") || text.includes("做空")) {
      const asset = text.match(/[A-Z]{2,4}/)?.[0] ?? "INJ";
      const direction = text.includes("做空") ? "做空" : "做多";
      aiMsg = {
        id: `c-${Date.now()}`,
        type: "ai",
        content: `请确认以下交易：\n\n${direction} ${asset} · 2x 杠杆 · 仓位 5%`,
        timestamp: new Date().toISOString(),
        meta: { asset, direction, leverage: 2, size: "5%" },
      };
    } else if (text.includes("持仓")) {
      aiMsg = {
        id: `c-${Date.now()}`,
        type: "result",
        content: "当前持仓：\n• INJ LONG 2x · 1500 枚 · 未实现盈亏 +$495\n• BTC SHORT 1.5x · 0.12 枚 · 未实现盈亏 +$169",
        timestamp: new Date().toISOString(),
      };
    } else {
      aiMsg = {
        id: `c-${Date.now()}`,
        type: "ai",
        content: "我已收到你的问题。当前 Social/OnChain/Macro 三方对 INJ 的看法偏正面，但 Macro 提示非农数据风险，建议谨慎开仓。",
        timestamp: new Date().toISOString(),
      };
    }

    setMessages((prev) => [...prev, userMsg, aiMsg]);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 flex h-[50px] items-center border-b border-black/5 bg-white/80 px-4 backdrop-blur-sm">
        <span className="text-base font-bold text-black/90">AI 交易助手</span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
        <div className="mx-auto max-w-3xl space-y-5">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-black/5 bg-white px-4 py-4">
        <div className="mx-auto max-w-3xl">
          <ChatEditor
            placeholder="输入交易指令或市场问题..."
            quickActions={["做多 INJ", "做空 BTC", "查询持仓", "全部平仓"]}
            showQuickActions
            onSend={handleSend}
            onQuickAction={handleSend}
          />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.type === "user";

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-[#1783ff] text-white" : "bg-black/[0.06] text-black/60"
        )}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div className={cn("max-w-[80%]", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-[#1783ff] text-white"
              : message.type === "error"
              ? "border border-[#ff3849]/20 bg-[#ff3849]/5 text-[#ff3849]"
              : message.type === "result"
              ? "border border-[#16c456]/20 bg-[#16c456]/5 text-black/80"
              : "border border-black/[0.08] bg-white text-black/80"
          )}
        >
          {message.content.split("\n").map((line, i) => (
            <div key={i}>{line}</div>
          ))}

          {message.meta && (
            <div className="mt-3 flex gap-2">
              <button className="flex items-center gap-1 rounded-lg bg-[#1783ff] px-3 py-1.5 text-xs font-medium text-white"
              >
                <CheckCircle2 size={12} /> 确认执行
              </button>
              <button className="rounded-lg border border-black/[0.13] bg-white px-3 py-1.5 text-xs font-medium text-black/70">
                修改参数
              </button>
              <button className="rounded-lg border border-black/[0.13] bg-white px-3 py-1.5 text-xs font-medium text-black/70">
                <XCircle size={12} /> 取消
              </button>
            </div>
          )}
        </div>

        <Time
          date={message.timestamp}
          options={{ hour: "2-digit", minute: "2-digit" }}
          className="mt-1 text-[10px] text-black/40"
        />
      </div>
    </div>
  );
}
