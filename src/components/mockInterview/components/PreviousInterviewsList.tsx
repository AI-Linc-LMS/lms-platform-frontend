// components/PreviousInterviewsList.tsx
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { InterviewRecord } from "../MockInterview";

interface PreviousInterviewsListProps {
  onViewRecord: (record: InterviewRecord) => void;
  onBack: () => void;
}

// Mock data - Replace with actual API call
const mockInterviews: InterviewRecord[] = [
  {
    id: "1",
    topic: "React",
    difficulty: "medium",
    date: new Date("2025-10-25"),
    duration: 2400, // in seconds
    score: 85,
    status: "completed",
    questionsAnswered: 8,
    totalQuestions: 10,
  },
  {
    id: "2",
    topic: "JavaScript",
    difficulty: "easy",
    date: new Date("2025-10-22"),
    duration: 1800,
    score: 92,
    status: "completed",
    questionsAnswered: 10,
    totalQuestions: 10,
  },
  {
    id: "3",
    topic: "System Design",
    difficulty: "hard",
    date: new Date("2025-10-20"),
    duration: 3600,
    score: 78,
    status: "completed",
    questionsAnswered: 6,
    totalQuestions: 8,
  },
  {
    id: "4",
    topic: "TypeScript",
    difficulty: "medium",
    date: new Date("2025-10-18"),
    duration: 1200,
    score: 0,
    status: "abandoned",
    questionsAnswered: 3,
    totalQuestions: 10,
  },
  {
    id: "5",
    topic: "Node.js",
    difficulty: "hard",
    date: new Date("2025-10-15"),
    duration: 2700,
    score: 88,
    status: "completed",
    questionsAnswered: 7,
    totalQuestions: 8,
  },
];

const PreviousInterviewsList = ({
  onViewRecord,
  onBack,
}: PreviousInterviewsListProps) => {
  const [interviews] = useState<InterviewRecord[]>(mockInterviews);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "in-progress":
        return "warning";
      case "abandoned":
        return "error";
      default:
        return "default";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-300";
      case "medium":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "hard":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 font-bold";
    if (score >= 60) return "text-orange-600 font-bold";
    return "text-red-600 font-bold";
  };

  // Filter interviews
  const filteredInterviews = interviews.filter((interview) => {
    const matchesSearch = interview.topic
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesDifficulty =
      filterDifficulty === "all" || interview.difficulty === filterDifficulty;
    const matchesStatus =
      filterStatus === "all" || interview.status === filterStatus;
    return matchesSearch && matchesDifficulty && matchesStatus;
  });

  return (
    <div className="py-6">
      {/* Header with Stats */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">Total Interviews</p>
            <p className="text-3xl font-bold text-indigo-600">
              {interviews.length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-3xl font-bold text-green-600">
              {interviews.filter((i) => i.status === "completed").length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">Avg Score</p>
            <p className="text-3xl font-bold text-purple-600">
              {Math.round(
                interviews
                  .filter((i) => i.status === "completed")
                  .reduce((acc, i) => acc + i.score, 0) /
                  interviews.filter((i) => i.status === "completed").length
              )}
              %
            </p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">Total Time</p>
            <p className="text-3xl font-bold text-orange-600">
              {Math.round(
                interviews.reduce((acc, i) => acc + i.duration, 0) / 3600
              )}
              h
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <TextField
            placeholder="Search by topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            className="flex-1"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <span>🔍</span>
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" className="w-full md:w-48">
            <InputLabel>Difficulty</InputLabel>
            <Select
              value={filterDifficulty}
              label="Difficulty"
              onChange={(e) => setFilterDifficulty(e.target.value)}
            >
              <MenuItem value="all">All Levels</MenuItem>
              <MenuItem value="easy">Easy</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="hard">Hard</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" className="w-full md:w-48">
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="abandoned">Abandoned</MenuItem>
            </Select>
          </FormControl>
        </div>
      </div>

      {/* Table */}
      <TableContainer component={Paper} className="shadow-lg rounded-xl">
        <Table>
          <TableHead className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <TableRow>
              <TableCell className="font-bold">Date</TableCell>
              <TableCell className="font-bold">Topic</TableCell>
              <TableCell className="font-bold">Difficulty</TableCell>
              <TableCell className="font-bold">Duration</TableCell>
              <TableCell className="font-bold">Progress</TableCell>
              <TableCell className="font-bold">Score</TableCell>
              <TableCell className="font-bold">Status</TableCell>
              <TableCell className="font-bold">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInterviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" className="py-12">
                  <div className="text-gray-500">
                    <p className="text-xl mb-2">📋</p>
                    <p>No interviews found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredInterviews.map((interview) => (
                <TableRow
                  key={interview.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onViewRecord(interview)}
                >
                  <TableCell>{formatDate(interview.date)}</TableCell>
                  <TableCell>
                    <span className="font-semibold text-indigo-600">
                      {interview.topic}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize ${getDifficultyColor(
                        interview.difficulty
                      )}`}
                    >
                      {interview.difficulty}
                    </span>
                  </TableCell>
                  <TableCell>{formatDuration(interview.duration)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">
                        {interview.questionsAnswered}/{interview.totalQuestions}
                      </span>
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500"
                          style={{
                            width: `${
                              (interview.questionsAnswered /
                                interview.totalQuestions) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={getScoreColor(interview.score)}>
                      {interview.status === "abandoned"
                        ? "-"
                        : `${interview.score}%`}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={interview.status}
                      color={getStatusColor(interview.status) as any}
                      size="small"
                      className="capitalize"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewRecord(interview);
                      }}
                      className="text-indigo-600"
                    >
                      <span className="text-lg">👁️</span>
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Back Button */}
      <div className="mt-6">
        <button
          onClick={onBack}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:shadow-md transition-all"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
};

export default PreviousInterviewsList;
