import { useState } from "react";
import { TextField, Button, CircularProgress } from "@mui/material";
import { mockInterviewAPI } from "../services/api";
import BackButton from "./BackButton";

interface InterviewSchedulerProps {
  onScheduled: (interviewId: string) => void;
  onBack: () => void;
}

const InterviewScheduler = ({
  onScheduled,
  onBack,
}: InterviewSchedulerProps) => {
  const [topic, setTopic] = useState("");
  const [subtopic, setSubtopic] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSchedule = async () => {
    if (!topic || !subtopic) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const dateTimeToUse = scheduledDateTime || new Date().toISOString();

      const result = await mockInterviewAPI.createInterview(
        topic,
        subtopic,
        difficulty,
        dateTimeToUse
      );

      onScheduled(result.id);
    } catch (err: any) {
      setError(err.message || "Failed to schedule interview");
    } finally {
      setLoading(false);
    }
  };

  // Set default datetime to current time
  const getDefaultDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4">
          <BackButton onClick={onBack} label="Back" />
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Schedule Interview
        </h2>
        <p className="text-gray-600">
          Create a new interview session with your preferred settings
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
        <div className="space-y-6">
          {/* Topic */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Topic <span className="text-red-500">*</span>
            </label>
            <TextField
              fullWidth
              placeholder="e.g., Python, React, System Design"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              variant="outlined"
            />
          </div>

          {/* Subtopic */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Subtopic <span className="text-red-500">*</span>
            </label>
            <TextField
              fullWidth
              placeholder="e.g., Data Structures, Hooks, Microservices"
              value={subtopic}
              onChange={(e) => setSubtopic(e.target.value)}
              variant="outlined"
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {["Easy", "Medium", "Hard"].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                    difficulty === level
                      ? level === "Easy"
                        ? "bg-green-500 text-white shadow-lg scale-105"
                        : level === "Medium"
                        ? "bg-orange-500 text-white shadow-lg scale-105"
                        : "bg-red-500 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Scheduled Date Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Scheduled Date & Time
            </label>
            <TextField
              fullWidth
              type="datetime-local"
              value={scheduledDateTime || getDefaultDateTime()}
              onChange={(e) => setScheduledDateTime(e.target.value)}
              variant="outlined"
              InputLabelProps={{
                shrink: true,
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave as default to start immediately
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <p className="text-red-800 font-semibold">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              variant="outlined"
              onClick={onBack}
              disabled={loading}
              className="flex-1"
              style={{
                textTransform: "none",
                fontSize: "1rem",
                padding: "12px",
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSchedule}
              disabled={loading}
              className="flex-1"
              style={{
                background: "linear-gradient(to right, #6366f1, #8b5cf6)",
                textTransform: "none",
                fontSize: "1rem",
                padding: "12px",
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Schedule Interview"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 mb-2 flex items-center">
          <span className="mr-2">ℹ️</span> What happens next?
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">1.</span>
            <span>Your interview will be scheduled and saved</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">2.</span>
            <span>You'll be taken to the interview waiting room</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">3.</span>
            <span>Click "Start Interview" when ready to begin</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">4.</span>
            <span>
              Questions will be provided by the system based on your topic
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default InterviewScheduler;

