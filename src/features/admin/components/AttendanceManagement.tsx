import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getAttendanceActivities,
  getAttendanceActivityDetail,
  AttendanceActivity,
  AttendanceActivityDetail,
  AttendanceRecord,
} from "../../../services/attendanceApis";

interface AttendanceManagementProps {
  courseId?: number; // Optional for future use
}

const AttendanceManagement: React.FC<AttendanceManagementProps> = () => {
  const clientId = Number(import.meta.env.VITE_CLIENT_ID);

  const [selectedActivity, setSelectedActivity] =
    useState<AttendanceActivity | null>(null);
  const [activityDetail, setActivityDetail] =
    useState<AttendanceActivityDetail | null>(null);

  // Fetch attendance activities
  const { data: activities, isLoading } = useQuery({
    queryKey: ["attendance-activities"],
    queryFn: () => getAttendanceActivities(clientId),
  });

  const handleViewRecords = async (activity: AttendanceActivity) => {
    const detail = await getAttendanceActivityDetail(clientId, activity.id);
    setActivityDetail(detail);
    setSelectedActivity(activity);
  };

  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    alert("Code copied to clipboard!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[var(--primary-500)]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--primary-500)]">
          Attendance Activities
        </h2>
        <p className="text-gray-600 mt-1">
          View attendance activities and their details
        </p>
      </div>

      {/* Activities List */}
      <div className="space-y-4">
        {activities && activities.length > 0 ? (
          activities.map((activity) => (
            <AttendanceActivityCard
              key={activity.id}
              activity={activity}
              onViewRecords={handleViewRecords}
              onCopyCode={copyCodeToClipboard}
            />
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            No attendance activities found.
          </div>
        )}
      </div>

      {/* Records Modal */}
      {activityDetail && selectedActivity && (
        <RecordsModal
          activity={selectedActivity}
          records={activityDetail.attendees}
          onClose={() => {
            setActivityDetail(null);
            setSelectedActivity(null);
          }}
        />
      )}
    </div>
  );
};

// Activity Card Component
const AttendanceActivityCard: React.FC<{
  activity: AttendanceActivity;
  onViewRecords: (activity: AttendanceActivity) => void;
  onCopyCode: (code: string) => void;
}> = ({ activity, onViewRecords, onCopyCode }) => {
  return (
    <div
      className={`p-4 border rounded-lg ${
        activity.is_active
          ? "border-green-300 bg-green-50"
          : "border-gray-300 bg-gray-50"
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h4 className="text-lg font-semibold">{activity.title}</h4>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                activity.is_active
                  ? "bg-green-200 text-green-800"
                  : "bg-gray-300 text-gray-700"
              }`}
            >
              {activity.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          {activity.description && (
            <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
          )}
          <div className="mt-2 text-sm text-gray-500">
            Created: {new Date(activity.created_at).toLocaleString()}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {activity.is_active && activity.code && (
            <div className="text-right">
              <div className="text-3xl font-bold text-[var(--primary-500)] mb-1">
                {activity.code}
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-2">
            {activity.is_active && activity.code && (
              <button
                onClick={() => onCopyCode(activity.code!)}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              >
                Copy Code
              </button>
            )}
            <button
              onClick={() => onViewRecords(activity)}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
            >
              View Attendees ({activity.attendee_count || 0})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Records Modal Component
const RecordsModal: React.FC<{
  activity: AttendanceActivity;
  records: AttendanceRecord[];
  onClose: () => void;
}> = ({ activity, records, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-[var(--primary-500)]">
            Attendance Records - {activity.title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm font-medium">
            Total Present: {records.length}
          </div>
        </div>

        {records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    #
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Student Name
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Marked At
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr key={record.id} className="border-b">
                    <td className="px-4 py-3 text-sm">{index + 1}</td>
                    <td className="px-4 py-3 text-sm">{record.student_name}</td>
                    <td className="px-4 py-3 text-sm">
                      {record.student_email || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(record.marked_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No attendance records yet
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceManagement;
