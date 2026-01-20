"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface GrowthItem {
  area: string;
  suggested_action: string;
}

interface GrowthRoadmapChartProps {
  roadmap: GrowthItem[];
}

export function GrowthRoadmapChart({ roadmap }: GrowthRoadmapChartProps) {
  // Assign priority scores based on order (first item = highest priority)
  const chartData = roadmap.map((item, index) => ({
    area: item.area.length > 25 ? item.area.substring(0, 25) + "..." : item.area,
    fullArea: item.area,
    priority: roadmap.length - index, // Higher number = higher priority
    action: item.suggested_action,
    color: index === 0 ? "#2563EB" : index === 1 ? "#8b5cf6" : "#16A34A",
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg max-w-xs">
          <p className="font-semibold text-slate-900 mb-1">{data.fullArea}</p>
          <p className="text-sm text-slate-600">
            Priority: <strong>{data.priority}</strong>
          </p>
          <p className="text-sm text-slate-600 mt-1">{data.action}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Growth Areas Priority</h2>
          <p className="text-xs text-slate-500">Priority visualization</p>
        </div>
      </div>

      <div className="w-full h-[300px]">
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 120, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              type="number"
              domain={[0, roadmap.length + 1]}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              label={{
                value: "Priority Level",
                position: "insideBottom",
                offset: -5,
                style: { textAnchor: "middle", fill: "#6b7280" },
              }}
            />
            <YAxis
              type="category"
              dataKey="area"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              width={110}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="priority" radius={[0, 8, 8, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
