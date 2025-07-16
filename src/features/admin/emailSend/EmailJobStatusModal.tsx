import React from "react";

interface EmailJobStatusModalProps {
  open: boolean;
  onClose: () => void;
  jobStatus: Record<string, unknown> | null;
  onRefresh: () => void;
  onResend: () => void;
  isResending: boolean;
  isRefreshing: boolean;
}

const EmailJobStatusModal: React.FC<EmailJobStatusModalProps> = ({
  open,
  onClose,
  jobStatus,
  onRefresh,
  onResend,
  isResending,
  isRefreshing,
}) => {
  if (!open) return null;

  const total = Array.isArray(jobStatus?.emails) ? jobStatus.emails.length : 0;
  const success = Array.isArray(jobStatus?.successful_emails)
    ? jobStatus.successful_emails.length
    : 0;
  const failed = Array.isArray(jobStatus?.failed_emails)
    ? jobStatus.failed_emails.length
    : 0;
  const percent = total > 0 ? Math.round((success / total) * 100) : 0;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(240, 240, 240, 0.85)" }}
    >
      <div className="bg-white rounded-xl shadow-2xl p-8 min-w-[500px] max-w-[95vw] relative border border-gray-200">
        <h2 className="text-xl font-bold mb-6 text-gray-800">
          Email Job Status
        </h2>
        {jobStatus ? (
          <div className="mb-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-lg font-medium text-gray-800">
                <b>Task Name:</b>{" "}
                {typeof jobStatus.task_name === "string"
                  ? jobStatus.task_name.substring(0, 20) + "..."
                  : "Untitled Task"}
              </div>
              <div className="text-right">
                <div className="text-lg font-medium text-blue-600">
                  <b>Total Emails:</b> {total}
                </div>
              </div>
            </div>
            <div className="text-start">
              <b>Status:</b>{" "}
              {typeof jobStatus.status === "string"
                ? jobStatus.status
                : "UNKNOWN"}
              <br />
              <b>Created At:</b>{" "}
              {typeof jobStatus.created_at === "string"
                ? new Date(jobStatus.created_at).toLocaleString()
                : "UNKNOWN"}
            </div>
            <div className="flex gap-8">
              <div className="text-center">
                <div className="text-sm text-green-600">
                  <b>Successful : {success}</b>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-red-600">
                  <b>Failed : {failed}</b>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 text-gray-500 text-center">
            Loading status...
          </div>
        )}
        <div className="flex gap-3 mt-4 py-2">
          {jobStatus && jobStatus.status === "IN_PROGRESS" && (
            <div className="w-full relative mt-auto mb-1 h-3">
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-4 rounded-full transition-all duration-300"
                  style={{
                    width: `${percent}%`,
                    background:
                      percent === 100
                        ? "#22c55e"
                        : "linear-gradient(90deg, #22c55e 0%, #bef264 100%)",
                    position: "relative",
                  }}
                >
                  {percent === 100 && (
                    <span
                      className="absolute left-0 top-0 h-full w-full pointer-events-none"
                      style={{
                        animation: "shine 1.2s linear infinite",
                        background:
                          "linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 100%)",
                        backgroundSize: "200% 100%",
                      }}
                    ></span>
                  )}
                </div>
              </div>
              <style>{`
                @keyframes shine {
                  0% { background-position: -200% 0; }
                  100% { background-position: 200% 0; }
                }
              `}</style>
            </div>
          )}
          {jobStatus && jobStatus.status !== "COMPLETED" && (
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-medium"
              onClick={onRefresh}
              disabled={isRefreshing || isResending}
            >
              {isRefreshing ? "Refreshing..." : "Refresh Status"}
            </button>
          )}
          {jobStatus && jobStatus.status === "COMPLETED" && (
            <button
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-medium"
              onClick={onClose}
            >
              OK
            </button>
          )}
          {jobStatus && failed > 0 && (
            <button
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 font-medium"
              onClick={onResend}
              disabled={isResending || isRefreshing}
            >
              {isResending ? "Resending..." : "Resend Failed Emails"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailJobStatusModal;
