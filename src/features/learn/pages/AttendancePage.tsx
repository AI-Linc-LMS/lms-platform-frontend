import React from "react";
import { useTranslation } from "react-i18next";
import AttendanceMarking from "../components/AttendanceMarking";

const AttendancePage: React.FC = () => {
  const { t } = useTranslation();
  const activityId =
    new URLSearchParams(window.location.search).get("activityId") || "0";
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto mt-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("attendance.title")}
          </h1>
          <p className="text-gray-600 mt-2">{t("attendance.subtitle")}</p>
        </div>

        <AttendanceMarking activityId={parseInt(activityId)} />
      </div>
    </div>
  );
};

export default AttendancePage;
