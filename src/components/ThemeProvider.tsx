"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext<{ theme: "light" | "dark"; toggleTheme: () => void } | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      toggleTheme();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = async () => {
      // Create overlay for circular expansion
      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100vw";
      overlay.style.height = "100vh";
      overlay.style.zIndex = "9999";
      overlay.style.pointerEvents = "none";
      overlay.style.backgroundColor = theme === "dark" ? "#09090b" : "#ffffff";
      overlay.style.clipPath = "circle(0% at 50% 50%)";
      overlay.style.transition = "clip-path 1.2s cubic-bezier(0.65, 0, 0.35, 1)";
      document.body.appendChild(overlay);

      // Trigger transition
      requestAnimationFrame(() => {
        overlay.style.clipPath = "circle(150% at 50% 50%)";
      });

      // Wait for mid-transition to swap the class
      setTimeout(() => {
        if (theme === "dark") {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }, 600);

      // Clean up
      setTimeout(() => {
        document.body.removeChild(overlay);
      }, 1300);
    };

    applyTheme();
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
