import { JSX } from "react";
import { ScholarshipRedemptionData } from "../types/assessmentTypes";

type Metric = {
  label: string;
  value: number;
  unit: string;
  color: string;
  icon: JSX.Element;
};

type PerformanceReportProps = {
  data: Metric[];
  redeemData: ScholarshipRedemptionData;
  clientId: number;
  assessmentId: string;
};

const PerformanceReport = ({ data }: PerformanceReportProps) => {
  return (
    <div className="w-full relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-50)]/30 via-transparent to-[var(--secondary-50)]/20 rounded-3xl -z-10"></div>

      {/* Header Section */}
      <div className="flex flex-col items-center mb-8 sm:mb-10 relative">
        {/* Glowing badge */}
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-[var(--primary-500)]/30 blur-2xl rounded-full animate-pulse"></div>
          <div className="relative flex items-center px-5 py-2.5 bg-gradient-to-r from-[var(--primary-500)]/15 to-[var(--secondary-500)]/15 backdrop-blur-sm rounded-full border border-[var(--primary-200)]/60 shadow-lg">
            <svg
              className="w-5 h-5 text-[var(--primary-500)] mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <span className="text-[var(--primary-600)] text-sm sm:text-base font-bold bg-gradient-to-r from-[var(--primary-600)] to-[var(--secondary-600)] bg-clip-text text-transparent">
              AI Generated Report
            </span>
          </div>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-[var(--primary-700)] via-[var(--primary-600)] to-[var(--secondary-600)] bg-clip-text text-transparent text-center px-2 drop-shadow-sm">
          Performance Report
        </h2>
        <div className="mt-4 w-32 h-1 bg-gradient-to-r from-transparent via-[var(--primary-500)] to-transparent rounded-full"></div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
        {data.map((metric: Metric, index: number) => {
          const isPlacementReadiness = metric.label === "Placement Readiness";
          const isPercentage = metric.unit === "%";
          const progressValue = isPlacementReadiness
            ? metric.value / 5
            : isPercentage
            ? metric.value / 100
            : metric.value > 0
            ? 1
            : 0;

          return (
            <div
              key={metric.label}
              className="group relative flex flex-col items-center p-6 sm:p-8 bg-gradient-to-br from-white via-[var(--neutral-50)]/50 to-white rounded-3xl border-2 border-[var(--neutral-200)]/50 shadow-xl hover:shadow-2xl hover:border-[var(--primary-300)]/70 transition-all duration-700 ease-out hover:-translate-y-2 overflow-hidden"
              style={{
                animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
              }}
            >
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-500)]/0 via-[var(--primary-500)]/0 to-[var(--secondary-500)]/0 group-hover:from-[var(--primary-500)]/15 group-hover:via-[var(--primary-500)]/8 group-hover:to-[var(--secondary-500)]/15 transition-all duration-700 rounded-3xl"></div>

              {/* Shine effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1500 ease-in-out"></div>
              </div>

              {/* Outer glow ring */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[var(--primary-500)]/20 via-[var(--secondary-500)]/20 to-[var(--primary-500)]/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10"></div>

              {/* Label */}
              <span className="relative text-[var(--neutral-600)] text-xs sm:text-sm font-bold mb-5 text-center leading-relaxed uppercase tracking-wider">
                {metric.label}
              </span>

              {/* Circular Progress with Icon */}
              <div className="relative flex items-center justify-center mb-5 z-10">
                {/* Glow behind circle */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--primary-500)]/30 via-[var(--secondary-500)]/30 to-[var(--primary-500)]/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 scale-150"></div>

                <svg
                  width="120"
                  height="120"
                  viewBox="0 0 70 70"
                  className="relative w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 drop-shadow-2xl z-10"
                >
                  <defs>
                    <linearGradient
                      id={`bg-gradient-${index}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="rgba(229, 231, 235, 0.2)" />
                      <stop
                        offset="100%"
                        stopColor="rgba(229, 231, 235, 0.5)"
                      />
                    </linearGradient>
                    <linearGradient
                      id={`progress-gradient-${index}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        stopColor={metric.color}
                        stopOpacity="0.7"
                      />
                      <stop
                        offset="50%"
                        stopColor={metric.color}
                        stopOpacity="1"
                      />
                      <stop
                        offset="100%"
                        stopColor={metric.color}
                        stopOpacity="0.9"
                      />
                    </linearGradient>
                  </defs>

                  {/* Background circle */}
                  <circle
                    cx="35"
                    cy="35"
                    r="26"
                    fill="none"
                    stroke={`url(#bg-gradient-${index})`}
                    strokeWidth="8"
                    className="transition-all duration-500"
                  />

                  {/* Progress circle with gradient */}
                  {progressValue > 0 && (
                    <circle
                      cx="35"
                      cy="35"
                      r="26"
                      fill="none"
                      stroke={`url(#progress-gradient-${index})`}
                      strokeWidth="9"
                      strokeDasharray={2 * Math.PI * 26}
                      strokeDashoffset={2 * Math.PI * 26 * (1 - progressValue)}
                      strokeLinecap="round"
                      className="transition-all duration-1500 ease-out group-hover:stroke-[10]"
                      style={{
                        filter: `drop-shadow(0 0 12px ${metric.color}50)`,
                        transform: "rotate(-90deg)",
                        transformOrigin: "35px 35px",
                      }}
                    />
                  )}
                </svg>

                {/* Icon overlay with glow */}
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 flex items-center justify-center">
                    {/* Icon glow background */}
                    <div className="absolute inset-0 bg-[var(--primary-500)]/30 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-150"></div>
                    {/* Icon */}
                    <div className="relative text-[var(--primary-600)] group-hover:text-[var(--primary-500)] group-hover:scale-110 transition-all duration-500 drop-shadow-lg">
                      {metric.icon}
                    </div>
                  </div>
                </div>
              </div>

              {/* Value display with gradient */}
              <div className="relative flex items-baseline justify-center gap-2 z-10">
                <span
                  className="text-4xl sm:text-5xl lg:text-6xl font-extrabold bg-gradient-to-br from-[var(--primary-700)] via-[var(--primary-600)] to-[var(--secondary-600)] bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-500"
                  style={{
                    textShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                  }}
                >
                  {metric.value.toFixed(
                    isPercentage || isPlacementReadiness ? 1 : 0
                  )}
                </span>
                {metric.unit && (
                  <span className="text-xl sm:text-2xl font-bold text-[var(--neutral-500)] group-hover:text-[var(--primary-500)] transition-colors duration-500">
                    {metric.unit}
                  </span>
                )}
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[var(--primary-500)]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-b-3xl"></div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default PerformanceReport;
