"use client";

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface CognitiveWorkStyleData {
  thinking_style: {
    logical_score: number;
    creative_score: number;
    hybrid_score: number;
    dominant_style: string;
  };
  learning_preference: {
    visual: number;
    auditory: number;
    kinesthetic: number;
    reading: number;
  };
  risk_appetite: {
    score: number;
    level: string;
    description: string;
  };
  execution_vs_ideation: {
    execution_score: number;
    ideation_score: number;
    balance: string;
  };
  attention_span: {
    score: number;
    level: string;
    focus_tendency: string;
  };
}

interface CognitiveWorkStyleSectionProps {
  data: CognitiveWorkStyleData;
}

export function CognitiveWorkStyleSection({ data }: CognitiveWorkStyleSectionProps) {
  // Quadrant data for Execution vs Ideation
  const quadrantData = [
    {
      x: data.execution_vs_ideation.execution_score,
      y: data.execution_vs_ideation.ideation_score,
      name: "Your Position",
      fill: "#6366f1"
    }
  ];

  // Thinking style data
  const thinkingStyleData = [
    { name: "Logical", value: data.thinking_style.logical_score, fill: "#3b82f6" },
    { name: "Creative", value: data.thinking_style.creative_score, fill: "#8b5cf6" },
    { name: "Hybrid", value: data.thinking_style.hybrid_score, fill: "#ec4899" },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981";
    if (score >= 65) return "#3b82f6";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border-2 border-slate-200">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Cognitive & Work Style Analysis</h2>
          <p className="text-base text-slate-600 mt-1">How you think, learn, and work</p>
        </div>
      </div>

      {/* Thinking Style Quadrant */}
      <div className="mb-8 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Thinking Style Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {thinkingStyleData.map((item, index) => (
            <div key={index} className="bg-white rounded-xl p-5 border-2 border-slate-200">
              <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">{item.name}</p>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold" style={{ color: item.fill }}>
                  {item.value}
                </span>
                <span className="text-sm text-slate-500">/100</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all duration-1000"
                  style={{
                    width: `${item.value}%`,
                    backgroundColor: item.fill,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl p-4 border border-purple-200">
          <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-1">Dominant Style</p>
          <p className="text-lg font-bold text-slate-900">{data.thinking_style.dominant_style}</p>
        </div>
      </div>

      {/* Execution vs Ideation Quadrant */}
      <div className="mb-8 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Execution vs Ideation Balance</h3>
        <div className="w-full h-[400px] mb-4">
          <ResponsiveContainer>
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                dataKey="x"
                name="Execution"
                domain={[0, 100]}
                label={{ value: "Execution Score", position: "insideBottom", offset: -5 }}
                tick={{ fontSize: 12, fill: "#64748b" }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Ideation"
                domain={[0, 100]}
                label={{ value: "Ideation Score", angle: -90, position: "insideLeft" }}
                tick={{ fontSize: 12, fill: "#64748b" }}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-3">
                        <p className="font-bold text-slate-900 mb-1">{data.name}</p>
                        <p className="text-sm text-slate-600">Execution: {data.x}/100</p>
                        <p className="text-sm text-slate-600">Ideation: {data.y}/100</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter name="Balance" data={quadrantData} fill="#6366f1">
                {quadrantData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl p-4 border border-blue-200">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-1">Balance Assessment</p>
          <p className="text-lg font-bold text-slate-900">{data.execution_vs_ideation.balance}</p>
        </div>
      </div>

      {/* Additional Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-2">Risk Appetite</p>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold" style={{ color: getScoreColor(data.risk_appetite.score) }}>
              {data.risk_appetite.score}
            </span>
            <span className="text-sm text-slate-500">/100</span>
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">{data.risk_appetite.level}</p>
          <p className="text-xs text-slate-600">{data.risk_appetite.description}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
          <p className="text-sm font-semibold text-green-600 uppercase tracking-wide mb-2">Attention Span</p>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold" style={{ color: getScoreColor(data.attention_span.score) }}>
              {data.attention_span.score}
            </span>
            <span className="text-sm text-slate-500">/100</span>
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">{data.attention_span.level}</p>
          <p className="text-xs text-slate-600">{data.attention_span.focus_tendency}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">Learning Preference</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Visual</span>
              <span className="text-sm font-bold text-slate-900">{data.learning_preference.visual}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Auditory</span>
              <span className="text-sm font-bold text-slate-900">{data.learning_preference.auditory}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Kinesthetic</span>
              <span className="text-sm font-bold text-slate-900">{data.learning_preference.kinesthetic}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
