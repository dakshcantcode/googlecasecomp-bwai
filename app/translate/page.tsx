"use client";

import { useState } from "react";
import { LanguageSelector } from "@/components/translate/LanguageSelector";
import { LiveTranslator } from "@/components/translate/LiveTranslator";
import { QuestionTranslator } from "@/components/translate/QuestionTranslator";

export default function TranslatePage() {
  const [language, setLanguage] = useState("Hindi");

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-primary)", paddingTop: "70px" }}
    >
      {/* Page header */}
      <div
        className="px-6 py-3 border-b flex-shrink-0"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🕷</span>
              <span className="newspaper-label">LIVE TRANSLATOR</span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              Hear your professor in your language · Ask questions from your language
            </p>
          </div>
          <LanguageSelector onChange={setLanguage} />
        </div>
        <div className="newspaper-rule mt-3" />
      </div>

      {/* Two-panel layout */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ minHeight: "calc(100vh - 200px)" }}>

          {/* Left: Listen & Translate */}
          <div
            className="rounded-xl border p-5 flex flex-col"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)" }}
          >
            <LiveTranslator language={language} />
          </div>

          {/* Right: Ask a Question */}
          <div
            className="rounded-xl border p-5 flex flex-col"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)" }}
          >
            <QuestionTranslator language={language} />
          </div>

        </div>

        {/* Note about non-Latin scripts */}
        <p className="text-[10px] text-center mt-4" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-jetbrains), monospace" }}>
          Note: PDF export uses standard fonts. For CJK/Arabic/Devanagari scripts, characters may appear as boxes — the text content is preserved.
        </p>
      </div>
    </div>
  );
}
