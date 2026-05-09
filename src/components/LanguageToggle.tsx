"use client";
import { useState } from "react";

export function LanguageToggle() {
  const [showMessage, setShowMessage] = useState(false);

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="text-lg opacity-100 cursor-default"
        title="Français (actif)"
      >
        🇫🇷
      </button>
      <button
        type="button"
        onClick={() => {
          setShowMessage(true);
          setTimeout(() => setShowMessage(false), 3000);
        }}
        className="text-lg opacity-50 hover:opacity-100 transition-opacity"
        title="English (coming soon)"
      >
        🇬🇧
      </button>
      {showMessage && (
        <span className="text-xs text-text-tertiary ml-1">
          Bientôt disponible
        </span>
      )}
    </div>
  );
}