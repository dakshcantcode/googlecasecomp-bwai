"use client";

import { useEffect, useState } from "react";

export const SUPPORTED_LANGUAGES = [
  "English",
  "Hindi",
  "Spanish",
  "French",
  "Mandarin Chinese",
  "Arabic",
  "Portuguese",
  "German",
  "Japanese",
  "Korean",
  "Italian",
  "Russian",
  "Tamil",
  "Bengali",
  "Swahili",
];

const STORAGE_KEY = "cosynapse-lang";

interface LanguageSelectorProps {
  onChange?: (lang: string) => void;
}

export function LanguageSelector({ onChange }: LanguageSelectorProps) {
  const [language, setLanguage] = useState("Hindi");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
      setLanguage(stored);
      onChange?.(stored);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const lang = e.target.value;
    setLanguage(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    onChange?.(lang);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-jetbrains), monospace" }}>
        native lang:
      </span>
      <select
        value={language}
        onChange={handleChange}
        className="text-xs rounded px-2 py-1 border outline-none"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border-default)",
          color: "var(--text-primary)",
          fontFamily: "var(--font-jetbrains), monospace",
        }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>{lang}</option>
        ))}
      </select>
    </div>
  );
}

export function getNativeLanguage(): string {
  if (typeof window === "undefined") return "Hindi";
  return localStorage.getItem(STORAGE_KEY) ?? "Hindi";
}
