import React from "react";
import AttendanceManagement from "../components/AttendanceManagement";

const AttendanceManagementPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Attendance Management
          </h1>
          <p className="text-gray-600 mt-2">
            Create attendance activities and track student participation
          </p>
        </div>

        <AttendanceManagement />
      </div>
    </div>
  );
};

export default AttendanceManagementPage;
