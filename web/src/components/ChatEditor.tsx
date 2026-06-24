"use client";

import { useState, useRef } from "react";
import { Paperclip, Bot, ChevronDown, ArrowUp, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatEditorProps {
  placeholder?: string;
  quickActions?: string[];
  onSend?: (text: string) => void;
  onQuickAction?: (action: string) => void;
  showQuickActions?: boolean;
}

export default function ChatEditor({
  placeholder = "输入交易指令，例如：做多 INJ 2x",
  quickActions = ["做多 INJ", "做空 BTC", "查询持仓", "全部平仓"],
  onSend,
  onQuickAction,
  showQuickActions = false,
}: ChatEditorProps) {
  const [text, setText] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);

  const hasText = text.length > 0;

  const handleSend = () => {
    if (!hasText) return;
    onSend?.(text);
    setText("");
    if (editorRef.current) editorRef.current.textContent = "";
  };

  return (
    <div className="flex w-full max-w-[768px] flex-col items-center justify-center bg-white">
      {showQuickActions && (
        <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
          {quickActions.map((action) => (
            <button
              key={action}
              onClick={() => onQuickAction?.(action)}
              className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-medium text-black/70 transition-colors hover:border-[#1783ff]/30 hover:bg-[#1783ff]/5 hover:text-[#1783ff]"
            >
              {action}
            </button>
          ))}
        </div>
      )}

      <div className="flex w-full min-h-[130px] flex-col rounded-3xl border border-black/25 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.03),0_5px_16px_-4px_rgba(0,0,0,0.07)]"
      >
        {/* Input area */}
        <div className="relative min-h-[60px] px-4 pb-2.5 pt-3">
          {!hasText && (
            <div className="pointer-events-none absolute left-4 top-3 text-base leading-6 text-black/60">
              {placeholder}
            </div>
          )}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setText(e.currentTarget.textContent ?? "")}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="min-h-[24px] text-base leading-6 text-black/90 outline-none"
            style={{ wordBreak: "break-word" }}
          />
        </div>

        {/* Action bar */}
        <div className="flex min-h-[36px] items-end justify-between gap-2 px-2 pb-1">
          {/* Left */}
          <div className="flex items-center gap-2">
            <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[20px] border border-black/[0.13] bg-transparent text-black/60"
            >
              <Paperclip size={18} />
            </button>
            <button className="flex items-center gap-1 rounded-lg bg-black/5 px-2.5 py-1.5 text-[13px] font-medium text-black/70 transition-colors hover:bg-black/[0.08]"
            >
              <Bot size={14} />
              Agent
            </button>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 rounded-md bg-transparent px-2 py-1 text-[13px] text-black/60 transition-colors hover:bg-black/5"
            >
              K2.6 快速
              <ChevronDown size={12} />
            </button>
            <button
              disabled={!hasText}
              onClick={handleSend}
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-[22px] border-0 transition-colors",
                hasText ? "cursor-pointer bg-[#1783ff]" : "cursor-default bg-black/15"
              )}
            >
              <ArrowUp size={16} className="text-white/90" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
