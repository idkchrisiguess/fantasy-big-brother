"use client";

import {
  buildEventBreakdown,
  buildWeeklyPointsSeries,
  hasChartData,
} from "@/lib/chart-data";
import type { League } from "@/lib/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MANAGER_COLORS = [
  "#fb923c",
  "#60a5fa",
  "#34d399",
  "#a78bfa",
  "#f472b6",
  "#fbbf24",
  "#38bdf8",
  "#4ade80",
];

const chartMargin = { top: 8, right: 8, left: 0, bottom: 0 };

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#121a2e] p-4 sm:p-6">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1 text-xs text-zinc-500">{description}</p>
      <div className="mt-4 h-72 w-full min-w-0">{children}</div>
    </section>
  );
}

const tooltipStyle = {
  contentStyle: {
    background: "#0f1629",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    fontSize: "12px",
  },
  labelStyle: { color: "#e4e4e7" },
};

export function LeagueCharts({ league }: { league: League }) {
  if (!hasChartData(league)) {
    return (
      <p className="text-sm text-zinc-400">
        Complete the draft and log scoring events to see charts.
      </p>
    );
  }

  const weekly = buildWeeklyPointsSeries(league);
  const breakdown = buildEventBreakdown(league);

  return (
    <div className="space-y-6">
      <ChartCard
        title="Points over time"
        description="Cumulative manager points by week (through logged events)."
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={weekly.data} margin={chartMargin}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
              label={{
                value: "Week",
                position: "insideBottom",
                offset: -4,
                fill: "#71717a",
                fontSize: 11,
              }}
            />
            <YAxis
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip {...tooltipStyle} />
            <Legend
              wrapperStyle={{ fontSize: "12px", color: "#a1a1aa" }}
            />
            {weekly.managers.map((m, i) => (
              <Line
                key={m.id}
                type="monotone"
                dataKey={m.key}
                name={m.name}
                stroke={MANAGER_COLORS[i % MANAGER_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Points by event type"
        description="How each manager earned points (survival, comps, nominations, placement)."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={breakdown.data} margin={chartMargin}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="manager"
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip {...tooltipStyle} />
            <Legend
              wrapperStyle={{ fontSize: "12px", color: "#a1a1aa" }}
            />
            {breakdown.categories.map((cat) => (
              <Bar
                key={cat.key}
                dataKey={cat.key}
                name={cat.label}
                stackId="points"
                fill={cat.color}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
