import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const dummyData = Array.from({ length: 20 }, (_, i) => {
  const date = new Date(2025, 0, i + 1); // January 2025
  const dateString = date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
  return {
    date: dateString,
    Articles: Math.floor(Math.random() * 6) + 6,
    Videos: Math.floor(Math.random() * 5) + 5,
    Problems: Math.floor(Math.random() * 5) + 5,
    Quiz: Math.floor(Math.random() * 5) + 4,
    Subjective: Math.floor(Math.random() * 3) + 3,
    Development: Math.floor(Math.random() * 3) + 2,
  };
});

const colors: { [key: string]: string } = {
  Articles: "#234256",
  Videos: "var(--default-primary)",
  Problems: "#2A8CB0",
  Quiz: "var(----primary-300)",
  Subjective: "var(----primary-300)",
  Development: "var(--primary-50)",
};

const StudentDailyActivityChart = () => {
  const itemsPerPage = 10;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(dummyData.length / itemsPerPage);

  const currentData = dummyData.slice(
    page * itemsPerPage,
    page * itemsPerPage + itemsPerPage
  );

  const handleNext = () => {
    setPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const handlePrev = () => {
    setPage((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="rounded-xl p-4 shadow-md w-full ring-1 ring-[var(--primary-100)] ring-offset-1 max-w-[700px] max-h-[430px]">
      <h2 className="text-xl font-bold mb-4 text-[var(--default-primary)]">
        Student Daily Activity →
      </h2>
      <div className="mt-8">
        <ResponsiveContainer height={240}>
          <BarChart
            data={currentData}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            barSize={20}
            barGap={0}
            barCategoryGap="0%"
          >
            <CartesianGrid
              stroke="#ccc"
              horizontal
              vertical={false}
              strokeWidth={1}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#5D77A6" }}
              tickLine={false}
              axisLine={false}
              interval={0}
              minTickGap={0}
              scale="band"
            />
            <YAxis
              tickFormatter={(tick) => `${tick} hr`}
              tick={{ fontSize: 12, fill: "#5D77A6" }}
              tickLine={false}
              axisLine={false}
              padding={{ top: 10, bottom: 10 }}
            />
            {Object.keys(colors).map((key) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="a"
                fill={colors[key]}
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-2 mt-2 text-sm text-[#1A3C57] font-medium">
        {Object.entries(colors).map(([key, color]) => (
          <div key={key} className="flex items-center space-x-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span>{key}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-6 space-x-2">
        <div className="flex items-center gap-2">
          <div
            onClick={handlePrev}
            className={`w-8 h-8 md:w-10 md:h-10 rounded-full border border-[#D3E3F2] flex items-center justify-center cursor-pointer ${
              page === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title={page === 0 ? "Start of data" : "Previous"}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className="text-[#1A3C57]"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </div>
          <div
            onClick={handleNext}
            className={`w-8 h-8 md:w-10 md:h-10 rounded-full border border-[#D3E3F2] flex items-center justify-center cursor-pointer ${
              page >= totalPages - 1 ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title={page >= totalPages - 1 ? "End of data" : "Next"}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className="text-[#1A3C57]"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDailyActivityChart;
