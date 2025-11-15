import { useState, useEffect } from "react";
import {
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import {
  mockInterviewAPI,
  InterviewAttempt,
  InterviewQuestion,
} from "../services/api";
import { useToast } from "../../../contexts/ToastContext";
import BackButton from "./BackButton";

interface InterviewWaitingRoomProps {
  onStartSuccess: (questions: InterviewQuestion[], interviewId: string) => void;
  onBack: () => void;
}

const InterviewWaitingRoom = ({
  onStartSuccess,
  onBack,
}: InterviewWaitingRoomProps) => {
  const { error: showError, success } = useToast();
  const [scheduledInterviews, setScheduledInterviews] = useState<
    InterviewAttempt[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);

  useEffect(() => {
    fetchScheduledInterviews();
  }, []);

  const fetchScheduledInterviews = async () => {
    try {
      setLoading(true);
      const data = await mockInterviewAPI.getInterviewAttempts("scheduled");
      setScheduledInterviews(data);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to load scheduled interviews";
      showError("Loading Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async (interviewId: string) => {
    try {
      setStartingId(interviewId);

      const { questions } = await mockInterviewAPI.startInterviewById(
        interviewId
      );
      success("Interview Started!", "Loading your questions...");
      onStartSuccess(questions, interviewId);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to start interview";
      showError("Start Failed", errorMsg);
      setStartingId(null);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const toTitleCase = (str: string) => {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <CircularProgress size={60} />
      </div>
    );
  }

  return (
    <div className="py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4">
          <BackButton onClick={onBack} label="Back to Home" />
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Scheduled Interviews
        </h2>
        <p className="text-gray-600">
          Start your scheduled interviews when ready
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          Before You Begin
        </h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span className="text-gray-700">
              <strong>Camera & Microphone:</strong> Ensure your camera and
              microphone are working properly
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span className="text-gray-700">
              <strong>Quiet Environment:</strong> Find a quiet place without
              distractions
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span className="text-gray-700">
              <strong>Stable Connection:</strong> Ensure you have a stable
              internet connection
            </span>
          </li>
        </ul>
      </div>

      {/* Scheduled Interviews Table */}
      <TableContainer component={Paper} className="shadow-lg rounded-xl">
        <Table>
          <TableHead className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <TableRow>
              <TableCell className="font-bold">Scheduled Date</TableCell>
              <TableCell className="font-bold">Topic</TableCell>
              <TableCell className="font-bold">Difficulty</TableCell>
              <TableCell className="font-bold">Duration</TableCell>
              <TableCell className="font-bold">Status</TableCell>
              <TableCell className="font-bold">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scheduledInterviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" className="py-12">
                  <div className="text-gray-500">
                    <p className="text-lg font-semibold mb-2">
                      No scheduled interviews
                    </p>
                    <p className="text-sm">
                      Schedule an interview to see it here
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              scheduledInterviews.map((interview) => (
                <TableRow
                  key={interview.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <TableCell>
                    {interview.scheduled_date_time
                      ? formatDate(interview.scheduled_date_time)
                      : "Not set"}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-indigo-600">
                      {toTitleCase(interview.topic)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize ${
                        interview.difficulty === "Easy"
                          ? "bg-green-100 text-green-800 border-green-300"
                          : interview.difficulty === "Medium"
                          ? "bg-orange-100 text-orange-800 border-orange-300"
                          : "bg-red-100 text-red-800 border-red-300"
                      }`}
                    >
                      {interview.difficulty}
                    </span>
                  </TableCell>
                  <TableCell>
                    {interview.duration_minutes || 25} minutes
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={interview.status}
                      color="info"
                      size="small"
                      className="capitalize"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleStartInterview(String(interview.id))}
                      disabled={startingId !== null}
                      startIcon={
                        startingId === String(interview.id) ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <PlayArrowIcon />
                        )
                      }
                      style={{
                        background:
                          "linear-gradient(to right, #10b981, #059669)",
                        textTransform: "none",
                      }}
                    >
                      {startingId === String(interview.id)
                        ? "Starting..."
                        : "Start"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default InterviewWaitingRoom;
