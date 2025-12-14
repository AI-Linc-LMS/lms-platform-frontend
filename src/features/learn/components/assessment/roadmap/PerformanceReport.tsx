import { JSX } from "react";
import { ScholarshipRedemptionData } from "../types/assessmentTypes";
import { PaymentResult } from "../../../../../services/payment/razorpayService";

type Metric = {
  label: string;
  value: number;
  unit: string;
  color: string;
  icon: JSX.Element;
};

type PerformanceReportProps = {
  data: Metric[];
  // Updated props for ScholarshipCountdown with integrated payment
  redeemData: ScholarshipRedemptionData;
  isFlagshipSeatBooked?: boolean;
  isFlagshipCoursePaid?: boolean;
  assessmentDate?: string;
  // New required props for integrated payment functionality
  clientId: number;
  assessmentId: string;
  // Payment callback functions
  onPaymentSuccess?: (
    result: PaymentResult,
    type: "seat-booking" | "course-payment"
  ) => void;
  onPaymentError?: (error: string) => void;
  showToast?: (
    type: "success" | "error" | "warning" | "loading",
    title: string,
    message: string
  ) => void;
};
const clientName = import.meta.env.VITE_CLIENT_NAME;
const PerformanceReport = ({
  data,
}: // redeemData,
// // isFlagshipSeatBooked = false,
// isFlagshipCoursePaid = false,
// assessmentDate,
// clientId,
// assessmentId,
// onPaymentSuccess,
// onPaymentError,
// showToast
PerformanceReportProps) => {
  return (
    <div className="px-2 sm:px-4">
      <div className="flex flex-col items-center mb-3 sm:mb-4">
        <span className="text-[var(--font-dark)] text-sm sm:text-lg font-semibold mb-1">
          ✨ AI Generated ✨
        </span>
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-[var(--secondary-700)] text-center mb-4 sm:mb-6 lg:mb-8 px-2">
          {clientName} Student Performance Report
        </h2>
      </div>
      {/* Only show ScholarshipCountdown if not already purchased */}
      {/* {!isFlagshipCoursePaid && (
          <div className="w-full  mb-6">
            <ScholarshipCountdown
              assessmentDate={assessmentDate}
              expiryDays={7}
              redeemData={redeemData}
              // isFlagshipSeatBooked is not a valid prop for ScholarshipCountdown, so it is removed
              // isFlagshipCoursePaid={isFlagshipCoursePaid}
              clientId={clientId}
              assessmentId={assessmentId}
              onPaymentSuccess={onPaymentSuccess}
              onPaymentError={onPaymentError}
              showToast={showToast}
              className="w-full"
            />
          </div>
        )} */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 justify-center items-center">
        {data.map((metric: Metric, idx: number) => {
          const isPlacementReadiness = metric.label === "Placement Readiness";
          return (
            <div
              key={metric.label}
              className="flex flex-col items-center flex-1 min-w-[120px] sm:min-w-[150px] lg:min-w-[200px]"
            >
              <span className="text-gray-500 text-xs sm:text-sm lg:text-md mb-2 text-center">
                {metric.label}
              </span>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-1 w-full">
                <div
                  className="relative flex items-center justify-center"
                  style={{
                    minHeight: "50px",
                    minWidth: "50px",
                    maxHeight: "70px",
                    maxWidth: "70px",
                  }}
                >
                  <svg
                    width="50"
                    height="50"
                    viewBox="0 0 70 70"
                    className="sm:w-[60px] sm:h-[60px] lg:w-[70px] lg:h-[70px]"
                  >
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
                    <span className="w-full h-full flex items-center justify-center">
                      <span className="max-w-[24px] max-h-[24px] w-full h-full flex items-center justify-center">
                        {metric.icon}
                      </span>
                    </span>
                  </div>
                </div>
                <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#14212B] flex items-end text-center">
                  {metric.value}
                  {metric.unit && (
                    <span className="text-sm sm:text-base lg:text-lg font-semibold ml-1">
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
