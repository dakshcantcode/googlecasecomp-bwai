"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import MermaidChart from "@/components/ui/MermaidChart";
import type { VisualResponse } from "@/app/api/concepts/[id]/visual/route";

interface VisualModeProps {
  data: VisualResponse;
  conceptLabel: string;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-base font-semibold mb-3"
      style={{ color: "var(--accent-primary)", fontFamily: "var(--font-playfair), Georgia, serif" }}
    >
      {children}
    </h2>
  );
}

export function VisualMode({ data, conceptLabel }: VisualModeProps) {
  return (
    <div className="space-y-10 py-4">

      {/* Bar chart */}
      {data.bar && (
        <div>
          <SectionTitle>{data.bar.title}</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data.bar.labels.map((l, i) => ({ label: l, value: data.bar!.values[i] }))}
              margin={{ top: 8, right: 16, left: 0, bottom: data.bar.labels.length > 4 ? 56 : 24 }}
            >
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                angle={data.bar.labels.length > 4 ? -40 : 0}
                textAnchor={data.bar.labels.length > 4 ? "end" : "middle"}
                height={data.bar.labels.length > 4 ? 60 : 30}
                interval={0}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 8,
                  color: "var(--text-primary)",
                  fontSize: 12,
                }}
                formatter={(value) => [`${value} (${data.bar!.unit})`, ""]}
              />
              <Bar
                dataKey="value"
                fill="var(--accent-primary)"
                radius={[4, 4, 0, 0]}
                opacity={0.9}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Radar chart */}
      {data.radar && (
        <div>
          <SectionTitle>{data.radar.title}</SectionTitle>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart
              data={data.radar.dimensions.map((d, i) => ({ subject: d, value: data.radar!.values[i] }))}
              margin={{ top: 8, right: 32, bottom: 8, left: 32 }}
            >
              <PolarGrid stroke="var(--border-default)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: "var(--text-tertiary)", fontSize: 9 }}
                tickCount={4}
              />
              <Radar
                name={conceptLabel}
                dataKey="value"
                stroke="var(--accent-primary)"
                fill="var(--accent-primary)"
                fillOpacity={0.25}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 8,
                  color: "var(--text-primary)",
                  fontSize: 12,
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Timeline */}
      {data.timeline && (
        <div>
          <SectionTitle>{data.timeline.title}</SectionTitle>
          <div className="flex gap-4 overflow-x-auto pb-3">
            {data.timeline.steps.map((step, i) => (
              <div
                key={i}
                className="flex-shrink-0 rounded-xl p-4 border"
                style={{
                  minWidth: "180px",
                  maxWidth: "220px",
                  background: "var(--bg-secondary)",
                  borderColor: "var(--border-default)",
                }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-3"
                  style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
                >
                  {i + 1}
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                  {step.label}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mermaid flowchart */}
      {data.mermaid && (
        <div>
          <SectionTitle>Concept Flowchart</SectionTitle>
          <MermaidChart chart={data.mermaid} />
        </div>
      )}

      {!data.bar && !data.radar && !data.timeline && !data.mermaid && (
        <p className="text-center py-12" style={{ color: "var(--text-tertiary)" }}>
          No visual data available for this concept.
        </p>
      )}
    </div>
  );
}
