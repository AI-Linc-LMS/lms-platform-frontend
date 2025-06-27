import { JSX } from "react";

type Metric = {
  label: string;
  value: number;
  unit: string;
  color: string;
  icon: JSX.Element;
};

type PerformanceReportProps = {
  data: Metric[];
};

const PerformanceReport = ({ data }: PerformanceReportProps) => {
  return (
    <div>
      <div className="flex flex-col items-center mb-4">
        <span className="text-black text-lg font-semibold mb-1">
          ✨ AI Generated ✨
        </span>
        <h2 className="text-3xl md:text-4xl font-semibold text-[#264D64] text-center mb-8">
          AILINC Student Performance Report
        </h2>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0">
        {data.map((metric: Metric, idx: number) => {
          const isPlacementReadiness = metric.label === "Placement Readiness";
          return (
            <div
              key={metric.label}
              className={`flex flex-col items-center flex-1 min-w-[200px] ${
                idx === 1 ? "border-l border-gray-200 border-r px-4" : ""
              } ${idx === 2 || idx === 3 ? "border-r px-4" : ""} ${
                idx === 4 ? "px-4" : ""
              }`}
            >
              <span className="text-gray-500 text-md mb-2">{metric.label}</span>
              <div className="flex flex-row items-center justify-center gap-4 mb-1 w-full">
                <div
                  className="relative flex items-center justify-center"
                  style={{ minHeight: "70px", minWidth: "70px" }}
                >
                  <svg width="70" height="70" viewBox="0 0 70 70">
                    <circle
                      cx="35"
                      cy="35"
                      r="26"
                      stroke="#e5e7eb"
                      strokeWidth="14"
                      fill="none"
                    />
                    {/* Placement Readiness: fill according to value/5 */}
                    {isPlacementReadiness && metric.value > 0 && (
                      <circle
                        cx="35"
                        cy="35"
                        r="26"
                        stroke={metric.color}
                        strokeWidth="14"
                        fill="none"
                        strokeDasharray={2 * Math.PI * 26}
                        strokeDashoffset={
                          2 * Math.PI * 26 * (1 - metric.value / 5)
                        }
                        strokeLinecap="round"
                      />
                    )}
                    {/* Only show progress for percent metrics if value > 0 */}
                    {!isPlacementReadiness &&
                      typeof metric.value === "number" &&
                      metric.unit === "%" &&
                      metric.value > 0 && (
                        <circle
                          cx="35"
                          cy="35"
                          r="26"
                          stroke={metric.color}
                          strokeWidth="14"
                          fill="none"
                          strokeDasharray={2 * Math.PI * 26}
                          strokeDashoffset={
                            2 * Math.PI * 26 * (1 - metric.value / 100)
                          }
                          strokeLinecap="round"
                        />
                      )}
                    {/* For other metrics, show full color ring only if value > 0 */}
                    {!isPlacementReadiness &&
                      !(
                        typeof metric.value === "number" && metric.unit === "%"
                      ) &&
                      metric.value > 0 && (
                        <circle
                          cx="35"
                          cy="35"
                          r="26"
                          stroke={metric.color}
                          strokeWidth="14"
                          fill="none"
                          strokeDasharray={2 * Math.PI * 26}
                          strokeDashoffset={0}
                          strokeLinecap="round"
                        />
                      )}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {metric.icon}
                  </div>
                </div>
                <span className="text-3xl font-bold text-[#14212B] flex items-end">
                  {metric.value}
                  {metric.unit && (
                    <span className="text-lg font-semibold ml-1">
                      {metric.unit}
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


export default PerformanceReport;