"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";
const STORAGE_KEY = "pulse-theme";
const CHANGE_EVENT = "pulse-theme-change";

function getCurrentTheme(): Theme {
  // SSR returns light; the inline script in <head> applies the right
  // value before paint. Then useSyncExternalStore re-syncs at hydration.
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(callback: () => void) {
  // Cross-tab storage changes
  window.addEventListener("storage", callback);
  // Same-tab manual dispatch (after toggle)
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function applyTheme(theme: Theme) {
  if (theme === "dark") {
    document.documentElement.dataset.theme = "dark";
  } else {
    delete document.documentElement.dataset.theme;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage may be disabled (private mode, etc.); fail silently
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribe,
    getCurrentTheme,
    () => "light" as const,
  );

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => applyTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Passer en thème clair" : "Passer en thème sombre"}
      title={isDark ? "Thème clair" : "Thème sombre"}
      className="rounded-md border border-border-secondary bg-transparent w-9 h-9 flex items-center justify-center text-base hover:bg-bg-secondary transition-colors"
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
