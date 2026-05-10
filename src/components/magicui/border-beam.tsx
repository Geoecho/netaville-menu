"use client";

import { useEffect, useRef } from "react";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
  anchor?: number;
}

export const BorderBeam = ({
  className,
  size = 200,
  duration = 12,
  borderWidth = 4,
  colorFrom = "#00BFFE",
  colorTo = "#00BFFE",
  delay = 0,
}: BorderBeamProps) => {
  const beamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = beamRef.current;
    if (!el) return;

    let start: number | null = null;
    let animId: number;

    const animate = (timestamp: number) => {
      if (start === null) start = timestamp;
      const elapsed = (timestamp - start) / 1000 + delay;
      const angle = ((elapsed / duration) * 360) % 360;

      el.style.background = `conic-gradient(from ${angle}deg, transparent 0%, transparent 70%, ${colorFrom} 85%, ${colorTo} 95%, transparent 100%)`;

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [duration, delay, colorFrom, colorTo]);

  return (
    <div
      ref={beamRef}
      className={`pointer-events-none absolute inset-0 rounded-[inherit] z-[999] ${className || ""}`}
      style={{
        willChange: "background",
        WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
        WebkitMaskComposite: "xor",
        mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
        maskComposite: "exclude",
        padding: `${borderWidth}px`,
      }}
    />
  );
};
