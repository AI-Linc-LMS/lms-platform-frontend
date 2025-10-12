import React, { useState } from "react";
import { LiveSession } from "../../../services/live/liveServicesApis";
import { useTranslation } from "react-i18next";

interface PastRecordingsProps {
  pastLiveSessions: LiveSession[];
  refetch: () => void; // Optional refetch function to refresh data after updates
}

const PastRecordings: React.FC<PastRecordingsProps> = ({
  pastLiveSessions,
}) => {
  const { t } = useTranslation();
  const [filterDate, setFilterDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredRecordings = (pastLiveSessions || []).filter((recording) => {
    const matchesDate =
      !filterDate ||
      new Date(recording.class_datetime).toISOString().split("T")[0] ===
        filterDate;

    const matchesSearch =
      !searchTerm ||
      recording.topic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recording.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recording.instructor.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesDate && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleWatchRecording = (zoomRecordingLink: string) => {
    if (zoomRecordingLink) {
      window.open(zoomRecordingLink, "_blank");
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold text-[var(--neutral-500)] mb-4 md:mb-0">
          {t("live.pastSessions.title")}
        </h2>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder={t("live.pastSessions.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)]"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)]"
          />
        </div>
      </div>

      {filteredRecordings.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {t("live.pastSessions.noRecordings.title")}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t("live.pastSessions.noRecordings.description")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecordings.map((recording) => (
            <div
              key={recording.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[var(--primary-200)] hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="p-6">
                <h3 className="font-bold text-[var(--neutral-500)] text-lg mb-2 line-clamp-2">
                  {recording.topic_name}
                </h3>
                <p className="text-[var(--neutral-300)] text-sm mb-4 line-clamp-2">
                  {recording.description}
                </p>

                <div className="flex items-center space-x-3 mb-4">
                  <div className="text-sm">
                    <p className="font-medium text-[var(--neutral-500)]">
                      {recording.instructor}
                    </p>
                    <p className="text-[var(--neutral-300)]">
                      {formatDate(recording.class_datetime)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-row justify-between">
                  {recording?.recording_link && (
                    <div className="flex justify-end">
                      <button
                        onClick={() =>
                          handleWatchRecording(recording?.recording_link || "")
                        }
                        className="bg-[var(--primary-500)] hover:bg-[var(--primary-600)] text-[var(--font-light)] px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-95"
                      >
                        Watch Recording
                      </button>
                    </div>
                  )}
                  {!recording?.recording_link && (
                    <div className="flex justify-end">
                      <button
                        onClick={() =>
                          handleWatchRecording(recording?.recording_link || "")
                        }
                        className="bg-[var(--primary-500)] hover:bg-[var(--primary-600)] text-[var(--font-light)] px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-95"
                      >
                        Recording Coming Soon
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PastRecordings;
