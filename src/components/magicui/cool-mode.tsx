"use client";

import { useEffect, useRef } from "react";

export interface CoolModeProps {
  children: React.ReactNode;
  options?: {
    particle?: string;
    particleCount?: number;
    speedHoriz?: number;
    speedUp?: number;
  };
}

export const CoolMode = ({ children, options }: CoolModeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const particleCount = options?.particleCount || 15;
    const particle = options?.particle || "/netaville-logo.svg";

    for (let i = 0; i < particleCount; i++) {
      const el = document.createElement("img");
      el.src = particle;
      el.className = "pointer-events-none absolute z-[9999]";
      el.style.width = `${Math.random() * 20 + 10}px`;
      el.style.height = el.style.width;
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
      el.style.position = "fixed";
      el.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`;
      
      const angle = (Math.random() * 360 * Math.PI) / 180;
      const velocity = Math.random() * 10 + 5;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;
      
      let opacity = 1;
      let curX = e.clientX;
      let curY = e.clientY;

      document.body.appendChild(el);

      const animate = () => {
        if (opacity <= 0) {
          el.remove();
          return;
        }

        opacity -= 0.02;
        curX += vx;
        curY += vy;
        
        el.style.opacity = opacity.toString();
        el.style.left = `${curX}px`;
        el.style.top = `${curY}px`;
        
        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    }
  };

  return (
    <div ref={containerRef} onClick={handleClick} className="inline-block">
      {children}
    </div>
  );
};
