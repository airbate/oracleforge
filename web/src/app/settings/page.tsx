"use client";

import { useState } from "react";
import { useSettings } from "@/hooks/useData";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

const tabs = ["LLM 配置", "风险参数", "数据源", "Injective", "信号频率"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("LLM 配置");
  const [showKey, setShowKey] = useState(false);
  const { data: settings, loading } = useSettings();

  if (loading || !settings) {
    return (
      <div className="flex h-full flex-col">
        <header className="sticky top-0 z-10 flex h-[50px] items-center border-b border-black/5 bg-white/80 px-4 backdrop-blur-sm">
          <span className="text-base font-bold text-black/90">系统设置</span>
        </header>
        <div className="flex flex-1 items-center justify-center text-sm text-black/40">加载配置中...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 flex h-[50px] items-center border-b border-black/5 bg-white/80 px-4 backdrop-blur-sm">
        <span className="text-base font-bold text-black/90">系统设置</span>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Settings sidebar */}
        <div className="w-full border-b border-black/5 bg-black/[0.02] p-2 md:w-52 md:border-b-0 md:border-r">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                activeTab === tab
                  ? "bg-white text-black/90 shadow-sm"
                  : "text-black/60 hover:bg-white/50 hover:text-black/80"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Settings content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {activeTab === "LLM 配置" && (
            <div className="mx-auto max-w-2xl space-y-4">
              <div className="mb-4 text-lg font-bold text-black/90">LLM 配置</div>
              {Object.entries(settings.llm).map(([agent, config]) => (
                <div key={agent} className="rounded-2xl border border-black/[0.08] bg-white p-4">
                  <div className="mb-3 text-sm font-bold text-black/90">{agent === "default" ? "默认模型" : `${agent} Agent`}</div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Provider" defaultValue={config.provider} />
                    <Field label="Model" defaultValue={config.model} />
                    <Field label="Base URL" defaultValue={config.baseUrl} className="md:col-span-2" />
                    <div className="md:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-black/60">API Key</label>
                      <div className="relative">
                        <input
                          type={showKey ? "text" : "password"}
                          defaultValue={config.apiKey || "sk-****************"}
                          className="w-full rounded-xl border border-black/[0.13] bg-white px-3 py-2 pr-10 text-sm text-black/80 outline-none focus:border-[#1783ff]"
                        />
                        <button
                          onClick={() => setShowKey(!showKey)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-black/40"
                        >
                          {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "风险参数" && (
            <div className="mx-auto max-w-2xl space-y-4">
              <div className="mb-4 text-lg font-bold text-black/90">风险参数</div>
              <div className="rounded-2xl border border-black/[0.08] bg-white p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="总资金 (USDT)" defaultValue={settings.risk.totalCapital.toString()} />
                  <Field label="最大仓位 %" defaultValue={settings.risk.maxPositionPercent.toString()} />
                  <Field label="日内亏损上限 (USDT)" defaultValue={settings.risk.maxDailyLoss.toString()} />
                  <Field label="杠杆上限" defaultValue={settings.risk.leverageLimit.toString()} />
                </div>
              </div>
              <div className="rounded-xl border border-[#ffd230]/30 bg-[#ffd230]/[0.05] p-3 text-sm text-black/70">
                当前风险档位：平衡型。修改后会在下一次信号生成时生效。
              </div>
            </div>
          )}

          {activeTab === "数据源" && (
            <div className="mx-auto max-w-2xl space-y-4">
              <div className="mb-4 text-lg font-bold text-black/90">数据源配置</div>
              <div className="rounded-2xl border border-black/[0.08] bg-white p-4">
                <div className="grid gap-4">
                  <Field label="Twitter / X API Key" defaultValue={settings.dataSources.twitterApiKey ?? ""} />
                  <Field label="Reddit API Key" defaultValue={settings.dataSources.redditApiKey ?? ""} />
                  <Field label="CoinGecko API Key" defaultValue={settings.dataSources.coingeckoApiKey ?? ""} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "Injective" && (
            <div className="mx-auto max-w-2xl space-y-4">
              <div className="mb-4 text-lg font-bold text-black/90">Injective 网络配置</div>
              <div className="rounded-2xl border border-black/[0.08] bg-white p-4">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-sm font-medium text-black/70">网络</span>
                  <select className="rounded-lg border border-black/[0.13] bg-white px-3 py-1.5 text-sm text-black/80">
                    <option value="testnet">testnet</option>
                    <option value="mainnet">mainnet</option>
                  </select>
                </div>
                <Field label="私钥" type="password" defaultValue="****************" />
                <div className="mt-3 flex items-center gap-2">
                  <input type="checkbox" defaultChecked={settings.injective.mock} id="mock" />
                  <label htmlFor="mock" className="text-sm text-black/70">模拟交易（不实际上链）</label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "信号频率" && (
            <div className="mx-auto max-w-2xl space-y-4">
              <div className="mb-4 text-lg font-bold text-black/90">信号频率</div>
              <div className="rounded-2xl border border-black/[0.08] bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-black/70">论坛辩论间隔</span>
                  <span className="text-sm font-bold text-black/90">{settings.forumIntervalMinutes} 分钟</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={60}
                  defaultValue={settings.forumIntervalMinutes}
                  className="w-full"
                />
                <div className="mt-4 flex items-center gap-2">
                  <input type="checkbox" id="emergency" />
                  <label htmlFor="emergency" className="text-sm text-black/70">
                    价格异动 {'>'} 3% 时自动触发紧急辩论
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  defaultValue,
  type = "text",
  className,
}: {
  label: string;
  defaultValue: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium text-black/60">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-black/[0.13] bg-white px-3 py-2 text-sm text-black/80 outline-none focus:border-[#1783ff]"
      />
    </div>
  );
}
