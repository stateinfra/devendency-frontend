"use client";

import { useEffect, useRef, useState } from "react";

export function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const { default: mermaid } = await import("mermaid");
      mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        themeVariables: {
          darkMode: true,
          background: "#1a1a1a",
          primaryColor: "#7f6df2",
          primaryTextColor: "#dcddde",
          lineColor: "#555",
        },
      });

      try {
        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg } = await mermaid.render(id, chart.trim());
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed to render diagram");
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <pre className="text-red-400 bg-[#1a1a1a] p-4 rounded-lg overflow-x-auto text-sm">
        <code>{chart}</code>
        <div className="mt-2 text-xs text-red-500">Mermaid error: {error}</div>
      </pre>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-6 flex justify-center overflow-x-auto rounded-lg bg-[#1a1a1a] p-4"
    />
  );
}
