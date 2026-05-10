"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

const ThemeContext = createContext<{ theme: "light" | "dark"; toggleTheme: () => void } | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const isAnimating = useRef(false);

  const applyThemeClass = (newTheme: "light" | "dark") => {
    const root = window.document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const toggleTheme = () => {
    if (isAnimating.current) return;
    const newTheme = theme === "light" ? "dark" : "light";
    isAnimating.current = true;

    // Create circular reveal overlay
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.zIndex = "999999";
    overlay.style.pointerEvents = "none";
    overlay.style.backgroundColor = newTheme === "dark" ? "#09090b" : "#ffffff";

    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    overlay.style.clipPath = `circle(0px at ${x}px ${y}px)`;
    overlay.style.transition = "clip-path 1.2s cubic-bezier(0.65, 0, 0.35, 1)";
    document.body.appendChild(overlay);

    // Trigger expansion
    requestAnimationFrame(() => {
      overlay.style.clipPath = `circle(${endRadius}px at ${x}px ${y}px)`;
    });

    // After overlay fully covers, swap theme underneath
    setTimeout(() => {
      applyThemeClass(newTheme);
      setTheme(newTheme);
    }, 1250);

    // Fade overlay out after theme is swapped
    setTimeout(() => {
      overlay.style.transition = "opacity 0.4s ease-out";
      overlay.style.opacity = "0";
    }, 1300);

    // Cleanup
    setTimeout(() => {
      if (overlay.parentNode) document.body.removeChild(overlay);
      isAnimating.current = false;
    }, 1800);
  };

  // Auto-toggle every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      toggleTheme();
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
