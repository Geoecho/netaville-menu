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
    const oldTheme = theme;
    isAnimating.current = true;

    // Create overlay with the OLD theme color, covering the whole screen.
    // We swap the theme underneath instantly, then shrink the overlay
    // to "reveal" the new theme from the center.
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "999999"; // Revert to front for proper reveal
    overlay.style.pointerEvents = "none";
    overlay.style.backgroundColor = oldTheme === "dark" ? "#09090b" : "#ffffff";
    overlay.style.willChange = "clip-path";

    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Start fully covering the screen
    overlay.style.clipPath = `circle(${endRadius}px at ${x}px ${y}px)`;
    document.body.appendChild(overlay);

    // Swap theme underneath (hidden by overlay)
    applyThemeClass(newTheme);
    setTheme(newTheme);

    // Force the browser to commit the initial state before animating
    overlay.getBoundingClientRect();

    // Animate the overlay shrinking to a point, revealing the new theme
    overlay.style.transition = "clip-path 1.2s cubic-bezier(0.65, 0, 0.35, 1)";
    requestAnimationFrame(() => {
      overlay.style.clipPath = `circle(0px at ${x}px ${y}px)`;
    });

    // Cleanup after animation completes
    setTimeout(() => {
      if (overlay.parentNode) document.body.removeChild(overlay);
      isAnimating.current = false;
    }, 1300);
  };

  // Ensure dark class matches theme state on mount (clears any stale class)
  useEffect(() => {
    applyThemeClass(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
