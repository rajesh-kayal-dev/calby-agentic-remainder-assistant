"use client";

import React, { useEffect, useRef } from "react";

interface ScrollRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  delay?: number;
  scale?: boolean;
  className?: string;
}

export function ScrollReveal({
  children,
  delay = 0,
  scale = false,
  className = "",
  style,
  ...props
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof window !== "undefined" && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLElement;
              target.classList.add(scale ? "reveal-scale-visible" : "reveal-visible");
              observer.unobserve(target);
            }
          });
        },
        {
          rootMargin: "0px 0px -30px 0px",
          threshold: 0.08,
        }
      );

      observer.observe(el);

      return () => {
        observer.disconnect();
      };
    } else {
      // Immediate fallback if IntersectionObserver is unavailable
      el.classList.add(scale ? "reveal-scale-visible" : "reveal-visible");
    }
  }, [scale]);

  return (
    <div
      ref={ref}
      className={`${scale ? "reveal-scale-init" : "reveal-init"} ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
