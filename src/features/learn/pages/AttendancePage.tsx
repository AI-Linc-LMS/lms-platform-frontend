import React from "react";
import AttendanceMarking from "../components/AttendanceMarking";
import BackToPreviousPage from "../../../commonComponents/common-buttons/back-buttons/back-to-previous-page/BackToPreviousPage";

const AttendancePage: React.FC = () => {
  const activityId =
    new URLSearchParams(window.location.search).get("activityId") || "0";
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <BackToPreviousPage />

      <div className="max-w-7xl mx-auto mt-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-2">
            Mark your attendance by entering the code provided by your
            instructor
          </p>
        </div>

        <AttendanceMarking activityId={parseInt(activityId)} />
      </div>
    </div>
  );
};

export default AttendancePage;
