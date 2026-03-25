"use client";

import React, { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface KaTeXRendererProps {
  text: string;
  className?: string;
}

export default function KaTeXRenderer({ text, className }: KaTeXRendererProps) {
  const html = useMemo(() => {
    // Replace $$...$$ (display) first, then $...$ (inline)
    let result = text;
    result = result.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
      } catch {
        return math;
      }
    });
    result = result.replace(/\$(.+?)\$/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
      } catch {
        return math;
      }
    });
    return result;
  }, [text]);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
