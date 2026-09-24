"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RevenueDataPoint {
  day: string;
  revenue: number;
  collected: number;
}

const defaultData: RevenueDataPoint[] = [
  { day: "Mon", revenue: 41200, collected: 37800 },
  { day: "Tue", revenue: 51500, collected: 44100 },
  { day: "Wed", revenue: 39000, collected: 36800 },
  { day: "Thu", revenue: 62000, collected: 54200 },
  { day: "Fri", revenue: 72100, collected: 61800 },
  { day: "Sat", revenue: 58000, collected: 50400 },
  { day: "Sun", revenue: 45000, collected: 40200 },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const revenueItem = payload.find((p) => p.name === "revenue");
    const collectedItem = payload.find((p) => p.name === "collected");

    return (
      <div className="bg-white/95 dark:bg-dark-card/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-slate-100 dark:border-dark-border text-sm min-w-[150px] transition-all">
        <div className="font-semibold text-slate-800 dark:text-white mb-1.5">{label}</div>
        {revenueItem && (
          <div className="flex items-center justify-between text-navy-800 dark:text-sky-300 font-medium my-0.5 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1E3A5F] dark:bg-sky-400 inline-block" />
              revenue :
            </span>
            <span className="font-bold ml-2">{revenueItem.value?.toLocaleString()}</span>
          </div>
        )}
        {collectedItem && (
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-medium my-0.5 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] inline-block" />
              collected :
            </span>
            <span className="font-bold ml-2">{collectedItem.value?.toLocaleString()}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function RevenueAreaChart({ data = defaultData }: { data?: RevenueDataPoint[] }) {
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const maxValue = Math.max(1, ...data.map((d) => Math.max(d.revenue, d.collected)));
  const yMax = Math.ceil((maxValue * 1.15) / 4) * 4 || 4;
  const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax].map((v) => Math.round(v));

  if (!mounted) {
    return (
      <div className="h-[280px] w-full flex items-center justify-center bg-slate-50/50 dark:bg-dark-card/30 rounded-2xl">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark transition-all">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Revenue this week
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
          Invoiced vs collected
        </p>
      </div>

      <div className="h-[260px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1E3A5F" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#1E3A5F" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="collectedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E2E8F0"
              className="dark:stroke-slate-800"
            />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94A3B8", fontSize: 12 }}
              dy={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94A3B8", fontSize: 11 }}
              domain={[0, yMax]}
              ticks={yTicks}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#1E3A5F"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#revenueGradient)"
              activeDot={{
                r: 5,
                fill: "#1E3A5F",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
            />
            <Area
              type="monotone"
              dataKey="collected"
              stroke="#F59E0B"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#collectedGradient)"
              activeDot={{
                r: 5,
                fill: "#F59E0B",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
