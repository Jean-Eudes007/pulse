"use client";

import { useSyncExternalStore } from "react";
import { Toaster } from "sonner";

// A-5 audit: sonner's default theme="system" follows the OS
// prefers-color-scheme, which can desync from Pulse's manual theme
// toggle. This wrapper reads document.documentElement.dataset.theme
// (same source-of-truth as ThemeToggle) so toasts always match the
// page contrast.

const CHANGE_EVENT = "pulse-theme-change";

function getTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

export function AppToaster() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light" as const);
  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      theme={theme}
    />
  );
}
