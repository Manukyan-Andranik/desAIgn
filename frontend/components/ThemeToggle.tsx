"use client";

import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl border border-border-subtle bg-bg-panel hover:bg-hover-bg hover:border-border-strong text-text-secondary hover:text-text-primary transition-all duration-300 active:scale-95 shadow-sm hover:shadow-md flex items-center justify-center relative overflow-hidden"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="transition-transform duration-500 ease-out transform hover:rotate-12">
        {!mounted ? (
          <Sun className="w-4 h-4 opacity-50 animate-pulse" />
        ) : theme === "dark" ? (
          <Sun className="w-4 h-4 text-amber-400 transition-colors" />
        ) : (
          <Moon className="w-4 h-4 text-accent-blue transition-colors" />
        )}
      </div>
    </button>
  );
}
