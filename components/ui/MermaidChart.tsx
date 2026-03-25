"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidChartProps {
  chart: string;
}

let mermaidInitialized = false;

export default function MermaidChart({ chart }: MermaidChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!chart || !ref.current) return;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;

        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: "dark",
            themeVariables: {
              primaryColor: "#2A2A2A",
              primaryTextColor: "#E5D9C3",
              primaryBorderColor: "#D4A843",
              lineColor: "#D4A843",
              secondaryColor: "#1E1E1E",
              tertiaryColor: "#333",
              background: "#1A1A1A",
              mainBkg: "#2A2A2A",
              nodeBorder: "#D4A843",
              clusterBkg: "#1E1E1E",
              titleColor: "#E5D9C3",
              edgeLabelBackground: "#1A1A1A",
              attributeBackgroundColorEven: "#1E1E1E",
              attributeBackgroundColorOdd: "#2A2A2A",
            },
          });
          mermaidInitialized = true;
        }

        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, chart);

        if (ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch {
        setError(true);
      }
    }

    render();
  }, [chart]);

  if (error) return null;

  return (
    <div
      ref={ref}
      className="w-full overflow-x-auto rounded-lg p-4"
      style={{ background: "var(--bg-primary)" }}
    />
  );
}
