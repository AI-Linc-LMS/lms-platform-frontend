import { useState, useEffect } from "react";
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
  CircularProgress,
  TablePagination,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { InterviewRecord } from "../index";
import { mockInterviewAPI } from "../services/api";
import BackButton from "./BackButton";

interface PreviousInterviewsListProps {
  onViewRecord: (record: InterviewRecord) => void;
  onBack: () => void;
  refreshKey?: number; // Add refresh trigger
}

const PreviousInterviewsList = ({
  onViewRecord,
  onBack,
  refreshKey,
}: PreviousInterviewsListProps) => {
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Fetch interviews from API
  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoading(true);

        // Try to fetch from API
        try {
          const data = await mockInterviewAPI.getInterviewAttempts();

          if (!data || data.length === 0) {
            setInterviews([]);
            return;
          }

          // Transform API data to match InterviewRecord interface
          const transformedData: InterviewRecord[] = data.map((attempt) => ({
            id: String(attempt.id),
            topic: attempt.topic,
            difficulty: attempt.difficulty,
            // Use created_at or scheduled_date_time, fallback to current date
            date: new Date(
              attempt.created_at || attempt.scheduled_date_time || Date.now()
            ),
            // API sends duration_minutes, convert to seconds for internal use
            duration: attempt.duration_minutes
              ? attempt.duration_minutes * 60
              : 0,
            score: attempt.evaluation_score?.overall_percentage || 0,
            status: attempt.status,
            // Count questions from the API data
            questionsAnswered:
              attempt.interview_transcript?.metadata?.completed_questions ||
              (attempt.status === "completed" ? 10 : 0),
            totalQuestions: attempt.questions_for_interview?.length || 10,
          }));

          setInterviews(transformedData);
        } catch (apiError: any) {
          // If API fails, show empty state
          setInterviews([]);
        }
      } catch (error: any) {
        // Fallback to empty
        setInterviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, [refreshKey]); // Re-fetch when refreshKey changes

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
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

  const getStatusLabel = (status: string): string => {
    // Normalize status to lowercase for comparison
    const normalizedStatus = status.toLowerCase().replace(/-/g, "_");

    switch (normalizedStatus) {
      case "completed":
        return "Completed";
      case "in_progress":
        return "In Progress";
      case "scheduled":
        return "Scheduled";
      case "cancelled":
      case "canceled":
        return "Cancelled";
      case "abandoned":
        return "Cancelled";
      default:
        return toTitleCase(status);
    }
  };

  const getStatusColor = (status: string) => {
    // Normalize status to lowercase for comparison
    const normalizedStatus = status.toLowerCase().replace(/-/g, "_");

    switch (normalizedStatus) {
      case "completed":
        return "success"; // Maps to "Completed" label
      case "in_progress":
        return "warning"; // Maps to "In Progress" label
      case "scheduled":
        return "info"; // Maps to "Scheduled" label
      case "cancelled":
      case "canceled":
      case "abandoned":
        return "error"; // Maps to "Cancelled" label
      default:
        return "default";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800 border-green-300";
      case "Medium":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "Hard":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const toTitleCase = (str: string) => {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
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

  // Paginated interviews
  const paginatedInterviews = filteredInterviews.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Handle pagination changes
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculate stats
  const completedInterviews = interviews.filter(
    (i) => i.status === "completed"
  );

  const totalTime = Math.round(
    interviews.reduce((acc, i) => acc + i.duration, 0) / 3600
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <CircularProgress size={60} />
      </div>
    );
  }

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
              {completedInterviews.length}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">Total Time</p>
            <p className="text-3xl font-bold text-orange-600">{totalTime}h</p>
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
                  <SearchIcon fontSize="small" />
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
              <MenuItem value="Easy">Easy</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Hard">Hard</MenuItem>
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
              <MenuItem value="scheduled">Scheduled</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
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
              <TableCell className="font-bold">Status</TableCell>
              <TableCell className="font-bold">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedInterviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" className="py-12">
                  <div className="text-gray-500">
                    <p className="text-lg font-semibold mb-2">
                      No interviews found
                    </p>
                    <p className="text-sm mt-2">
                      {interviews.length === 0
                        ? "Start your first interview to see results here"
                        : "Try adjusting your filters"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedInterviews.map((interview) => (
                <TableRow
                  key={interview.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onViewRecord(interview)}
                >
                  <TableCell>{formatDate(interview.date)}</TableCell>
                  <TableCell>
                    <span className="font-semibold text-indigo-600">
                      {toTitleCase(interview.topic)}
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
                    <Chip
                      label={getStatusLabel(interview.status)}
                      color={getStatusColor(interview.status) as any}
                      size="small"
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
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredInterviews.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Back Button */}
      <div className="mt-6">
        <BackButton onClick={onBack} label="Back to Home" />
      </div>
    </div>
  );
};

export default PreviousInterviewsList;
