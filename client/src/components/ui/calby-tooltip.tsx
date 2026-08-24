"use client";

import { ReactNode, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CalbyTooltipProps {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
  delayMs?: number;
}

export function CalbyTooltip({
  content,
  children,
  side = "bottom",
  className = "",
  delayMs = 150,
}: CalbyTooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setVisible(true);
    }, delayMs);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  const sideStyles = {
    top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
    left: "right-full mr-2 top-1/2 -translate-y-1/2",
    right: "left-full ml-2 top-1/2 -translate-y-1/2",
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          aria-hidden={!visible}
          className={cn(
            "absolute z-50 whitespace-nowrap rounded-xl border border-zinc-800 bg-zinc-900/95 px-2.5 py-1.5 text-[11px] font-medium text-zinc-100 shadow-xl backdrop-blur-md transition-opacity duration-150 animate-in fade-in duration-150 pointer-events-none select-none",
            sideStyles[side],
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
