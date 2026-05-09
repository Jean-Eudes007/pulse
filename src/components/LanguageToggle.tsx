"use client";
import { useState } from "react";

export function LanguageToggle() {
  const [showMessage, setShowMessage] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="opacity-100 cursor-default"
        title="Français (actif)"
      >
        <img
          src="https://flagcdn.com/w20/fr.png"
          width="20"
          height="15"
          alt="Français"
        />
      </button>
      <button
        type="button"
        onClick={() => {
          setShowMessage(true);
          setTimeout(() => setShowMessage(false), 3000);
        }}
        className="opacity-50 hover:opacity-100 transition-opacity"
        title="English (coming soon)"
      >
        <img
          src="https://flagcdn.com/w20/gb.png"
          width="20"
          height="15"
          alt="English"
        />
      </button>
      {showMessage && (
        <span className="text-xs text-text-tertiary">
          Bientôt disponible
        </span>
      )}
    </div>
  );
}