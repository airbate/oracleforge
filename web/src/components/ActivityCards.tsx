"use client";

import Image from "next/image";
import { ChevronRight, ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

const cards = [
  {
    title: "Kimi Work上线目标模式",
    desc: "多步复杂任务，让 Kimi 持续推进直到完成",
    image: "/images/activity-1.png",
  },
  {
    title: "Kimi桌面端已就位",
    desc: "Agent并行，处理本地文件，办公搭子已上线",
    image: "/images/activity-2.png",
  },
  {
    title: "全球首张 AI 原生信用卡来了！",
    desc: "立即预约，了解 Kimi 新卡计划",
    image: "/images/activity-3.png",
  },
];

// Duplicate first card at the end for seamless looping
const displayed = [...cards, cards[0]];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export default function ActivityCards() {
  const isMobile = useIsMobile();
  const cardHeight = 84;

  return (
    <div className="flex w-full items-center justify-center">
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          width: isMobile ? "100%" : "480px",
          maxWidth: "480px",
          height: `${cardHeight}px`,
        }}
      >
        <div
          className="km-carousel flex flex-col"
          style={{
            height: `${cardHeight * displayed.length}px`,
          }}
        >
          {displayed.map((card, i) => (
            <div
              key={i}
              className="flex w-full cursor-pointer items-center overflow-hidden bg-black/[0.03] transition-colors hover:bg-black/[0.05]"
              style={{ height: `${cardHeight}px` }}
            >
              {/* Image */}
              <div
                className="relative shrink-0 overflow-hidden"
                style={{
                  width: isMobile ? 72 : 92,
                  height: `${cardHeight}px`,
                }}
              >
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 72px, 92px"
                />
              </div>

              {/* Content */}
              <div
                className="flex min-w-0 flex-1 flex-col justify-center"
                style={{
                  padding: isMobile ? "12px 8px 12px 12px" : "16px 12px 16px 16px",
                  gap: 4,
                }}
              >
                <div
                  className="overflow-hidden text-ellipsis whitespace-nowrap font-medium text-black/90"
                  style={{
                    fontSize: isMobile ? 14 : 16,
                    lineHeight: isMobile ? "20px" : "24px",
                  }}
                >
                  {card.title}
                </div>
                <div
                  className="overflow-hidden text-ellipsis whitespace-nowrap text-black/60"
                  style={{
                    fontSize: isMobile ? 12 : 14,
                    lineHeight: isMobile ? "18px" : "20px",
                  }}
                >
                  {card.desc}
                </div>
              </div>

              {/* Action icon */}
              <div
                className="flex shrink-0 items-center justify-center"
                style={{
                  width: isMobile ? 32 : 40,
                  height: `${cardHeight}px`,
                  paddingRight: isMobile ? 4 : 8,
                }}
              >
                <div
                  className="flex items-center justify-center rounded-full bg-black/[0.08]"
                  style={{
                    width: isMobile ? 24 : 28,
                    height: isMobile ? 24 : 28,
                  }}
                >
                  <ArrowUp
                    size={isMobile ? 14 : 16}
                    className="text-black/50"
                    style={{ transform: "rotate(45deg)" }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel dots */}
        <div
          className="absolute left-2 top-1/2 flex -translate-y-1/2 flex-col gap-1"
          aria-hidden="true"
        >
          {cards.map((_, i) => (
            <div
              key={i}
              className="rounded-full bg-black/20"
              style={{ width: 6, height: 6 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
