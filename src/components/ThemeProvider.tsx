"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

const ThemeContext = createContext<{ theme: "light" | "dark"; toggleTheme: () => void } | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const isFirstRender = useRef(true);

  const applyThemeClass = (newTheme: "light" | "dark") => {
    const root = window.document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";

    // Use View Transitions API for the circular reveal animation
    if (typeof document !== "undefined" && "startViewTransition" in document && document.startViewTransition) {
      const transition = document.startViewTransition(() => {
        applyThemeClass(newTheme);
        setTheme(newTheme);
      });

      transition.ready.then(() => {
        // Calculate the largest possible radius from the center
        const x = window.innerWidth / 2;
        const y = window.innerHeight / 2;
        const endRadius = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        );

        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 1200,
            easing: "cubic-bezier(0.65, 0, 0.35, 1)",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      });
    } else {
      // Fallback for browsers without View Transitions API
      applyThemeClass(newTheme);
      setTheme(newTheme);
    }
  };

  // Set initial theme class on first render without animation
  useEffect(() => {
    if (isFirstRender.current) {
      applyThemeClass(theme);
      isFirstRender.current = false;
    }
  }, [theme]);

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
