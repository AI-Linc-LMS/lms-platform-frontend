import React, { useState } from "react";
import { Recording } from "../types/live.types";

interface PastRecordingsProps {
  recordings: Recording[];
}

const PastRecordings: React.FC<PastRecordingsProps> = ({ recordings }) => {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Filter past recordings based on category, date, and search term
  const filteredRecordings = recordings.filter((recording) => {
    const matchesCategory =
      filterCategory === "all" ||
      recording.category.toLowerCase().includes(filterCategory.toLowerCase());

    const matchesDate =
      !filterDate ||
      new Date(recording.recordedDate).toISOString().split("T")[0] ===
        filterDate;

    const matchesSearch =
      !searchTerm ||
      recording.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recording.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recording.trainer.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesDate && matchesSearch;
  });

  // Get unique categories for filter dropdown
  const categories = [
    "all",
    ...Array.from(new Set(recordings.map((r) => r.category))),
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleWatchRecording = (zoomRecordingLink: string) => {
    if (zoomRecordingLink) {
      window.open(zoomRecordingLink, "_blank");
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#343A40] mb-4 md:mb-0">
          Past Sessions
        </h2>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#255C79] focus:border-[#255C79]"
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

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#255C79] focus:border-[#255C79]"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#255C79] focus:border-[#255C79]"
          />
        </div>
      </div>

      {/* Recordings Grid */}
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
            No recordings found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters or search terms.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecordings.map((recording) => (
            <div
              key={recording.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#80C9E0] hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative">
                <img
                  src={recording.banner}
                  alt={recording.title}
                  className="w-full h-40 object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span className="bg-white/90 text-[#343A40] px-2 py-1 rounded-full text-xs font-medium">
                    {recording.category}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="bg-black/70 text-white px-2 py-1 rounded text-xs">
                    {formatDuration(recording.duration)}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-bold text-[#343A40] text-lg mb-2 line-clamp-2">
                  {recording.title}
                </h3>
                <p className="text-[#6C757D] text-sm mb-4 line-clamp-2">
                  {recording.description}
                </p>

                <div className="flex items-center space-x-3 mb-4">
                  <img
                    src={recording.trainer.avatar}
                    alt={recording.trainer.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="text-sm">
                    <p className="font-medium text-[#343A40]">
                      {recording.trainer.name}
                    </p>
                    <p className="text-[#6C757D]">
                      {formatDate(recording.recordedDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-sm text-[#6C757D]">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    <span>{recording.views.toLocaleString()} views</span>
                  </div>

                  <button
                    onClick={() =>
                      handleWatchRecording(recording.zoomRecordingLink)
                    }
                    className="bg-[#255C79] hover:bg-[#1E4A63] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-95"
                  >
                    Watch Recording
                  </button>
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
