"use client";

import { cn } from "@/lib/utils";
import type { AgentRole } from "@/types";

interface AgentStatusProps {
  agents?: { role: AgentRole; online: boolean; task?: string }[];
}

const defaultAgents: { role: AgentRole; online: boolean; task?: string }[] = [
  { role: "Social", online: true, task: "监听 Twitter" },
  { role: "OnChain", online: true, task: "扫描 OI" },
  { role: "Macro", online: true, task: "追踪宏观事件" },
  { role: "Host", online: true, task: "主持辩论" },
];

export default function AgentStatus({ agents = defaultAgents }: AgentStatusProps) {
  return (
    <div className="flex h-9 items-center justify-between border-t border-black/5 bg-white px-4 text-xs">
      <div className="flex items-center gap-4">
        {agents.map((agent) => (
          <div key={agent.role} className="flex items-center gap-1.5">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                agent.online ? "bg-[#16c456]" : "bg-black/20"
              )}
            />
            <span className="font-medium text-black/80">{agent.role}</span>
            {agent.task && <span className="text-black/40">{agent.task}</span>}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-black/50">
        <span className="h-2 w-2 rounded-full bg-[#16c456]" />
        系统运行中
      </div>
    </div>
  );
}
