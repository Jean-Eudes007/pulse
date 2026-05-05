"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TYPE_COLORS: Record<string, string> = {
  bug: "#ef4444",
  "idée": "#8b5cf6",
  "amélioration": "#10b981",
};

const STATUS_COLORS: Record<string, string> = {
  to_do: "#3b82f6",
  in_progress: "#eab308",
  review: "#a855f7",
  done: "#22c55e",
};

const STATUS_LABELS: Record<string, string> = {
  to_do: "À faire",
  in_progress: "En cours",
  review: "À relire",
  done: "Fait",
};

type Props = {
  typeCounts: { name: string; value: number }[];
  statusCounts: { name: string; value: number }[];
};

export function AnalyticsCharts({ typeCounts, statusCounts }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-bg-primary border border-border-tertiary rounded-lg p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-3">
          Répartition par type
        </h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={typeCounts}
              margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
            >
              <CartesianGrid stroke="var(--color-border-tertiary)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="var(--color-text-secondary)"
                fontSize={12}
              />
              <YAxis
                allowDecimals={false}
                stroke="var(--color-text-secondary)"
                fontSize={12}
              />
              <Tooltip
                cursor={{ fill: "var(--color-bg-secondary)" }}
                contentStyle={{
                  background: "var(--color-bg-primary)",
                  border: "1px solid var(--color-border-secondary)",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {typeCounts.map((d) => (
                  <Cell key={d.name} fill={TYPE_COLORS[d.name] ?? "#6b7280"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-bg-primary border border-border-tertiary rounded-lg p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-3">
          Backlog par statut
        </h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={statusCounts.map((d) => ({
                ...d,
                label: STATUS_LABELS[d.name] ?? d.name,
              }))}
              margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
            >
              <CartesianGrid stroke="var(--color-border-tertiary)" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="var(--color-text-secondary)"
                fontSize={12}
              />
              <YAxis
                allowDecimals={false}
                stroke="var(--color-text-secondary)"
                fontSize={12}
              />
              <Tooltip
                cursor={{ fill: "var(--color-bg-secondary)" }}
                contentStyle={{
                  background: "var(--color-bg-primary)",
                  border: "1px solid var(--color-border-secondary)",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {statusCounts.map((d) => (
                  <Cell key={d.name} fill={STATUS_COLORS[d.name] ?? "#6b7280"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
