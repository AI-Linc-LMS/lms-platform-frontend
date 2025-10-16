import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLiveAttendanceActivities,
  markAttendance,
} from "../../../services/attendanceApis";

interface AttendanceMarkingProps {
  activityId?: number; // Optional for future use
}

const AttendanceMarking: React.FC<AttendanceMarkingProps> = () => {
  const clientId = Number(import.meta.env.VITE_CLIENT_ID);
  const queryClient = useQueryClient();

  const [code, setCode] = useState("");
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(
    null
  );
  const [message, setMessage] = useState<{
    type: "success" | "error" | "";
    text: string;
  }>({ type: "", text: "" });

  // Fetch live attendance activities
  const { data: liveActivities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ["live-attendance"],
    queryFn: () => getLiveAttendanceActivities(clientId),
    refetchInterval: 60000, // Refetch every 30 seconds to get updated activities
  });

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: ({
      activityId,
      attendanceCode,
    }: {
      activityId: number;
      attendanceCode: string;
    }) => markAttendance(clientId, activityId, { code: attendanceCode }),
    onSuccess: (response) => {
      setMessage({ type: "success", text: response.message });
      setCode("");
      setSelectedActivityId(null);
      queryClient.invalidateQueries({
        queryKey: ["live-attendance"],
      });

      // Clear success message after 5 seconds
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
    },
    onError: (error: any) => {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Invalid or expired code",
      });

      // Clear error message after 5 seconds
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedActivityId) {
      setMessage({ type: "error", text: "Please select an activity" });
      return;
    }

    if (!code.trim()) {
      setMessage({ type: "error", text: "Please enter the attendance code" });
      return;
    }

    if (code.length !== 4) {
      setMessage({ type: "error", text: "Code must be 4 digits" });
      return;
    }

    markAttendanceMutation.mutate({
      activityId: selectedActivityId,
      attendanceCode: code.trim(),
    });
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCode(value);
  };

  const handleActivitySelect = (activityId: number) => {
    setSelectedActivityId(activityId);
    setCode("");
    setMessage({ type: "", text: "" });
  };

  if (isLoadingActivities) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[var(--primary-500)]"></div>
      </div>
    );
  }

  const selectedActivity = liveActivities?.find(
    (activity) => activity.id === selectedActivityId
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Live Attendance Activities */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-[var(--primary-500)] mb-6">
          Live Attendance Sessions
        </h2>

        {liveActivities && liveActivities.length > 0 ? (
          <div className="space-y-4">
            {liveActivities.map((activity) => {
              const isSelected = selectedActivityId === activity.id;

              return (
                <div
                  key={activity.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                    isSelected
                      ? "border-[var(--primary-500)] bg-blue-50"
                      : "border-gray-200 hover:border-[var(--primary-300)]"
                  }`}
                  onClick={() => handleActivitySelect(activity.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {activity.title}
                      </h3>
                      {activity.description && (
                        <p className="text-gray-600 text-sm mt-1">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Active Attendance Sessions
            </h3>
            <p className="text-gray-500">
              Your instructor hasn't started an attendance session yet. Check
              back later!
            </p>
          </div>
        )}
      </div>

      {/* Mark Attendance Form */}
      {selectedActivity && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-[var(--primary-500)] mb-4">
            Mark Attendance for: {selectedActivity.title}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="attendance-code"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Enter 4-Digit Attendance Code
              </label>
              <input
                id="attendance-code"
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder="0000"
                maxLength={4}
                className="w-full px-6 py-4 text-3xl font-bold text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent tracking-widest"
                disabled={markAttendanceMutation.isPending}
              />
            </div>

            {message.text && (
              <div
                className={`p-4 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-100 text-green-800 border border-green-300"
                    : "bg-red-100 text-red-800 border border-red-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  {message.type === "success" ? (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span className="font-medium">{message.text}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={markAttendanceMutation.isPending || code.length !== 4}
              className="w-full px-6 py-4 bg-[var(--primary-500)] text-white text-lg font-semibold rounded-lg hover:bg-[#1a4a5f] transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {markAttendanceMutation.isPending
                ? "Marking Attendance..."
                : "Mark Attendance"}
            </button>
          </form>

          <div className="text-center text-sm text-gray-500 mt-4">
            <p>
              💡 The attendance code is valid for 15 minutes from the time it
              was generated.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceMarking;
