"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Pagination,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import {
  adminAssessmentService,
  CodingProblemListItem,
} from "@/lib/services/admin/admin-assessment.service";
import { config } from "@/lib/config";

interface AIGeneratedCodingSectionProps {
  codingProblemIds: number[];
  onCodingProblemIdsChange: (ids: number[]) => void;
  generatedProblems: CodingProblemListItem[];
  onGeneratedProblemsChange: (problems: CodingProblemListItem[]) => void;
}

export function AIGeneratedCodingSection({
  codingProblemIds,
  onCodingProblemIdsChange,
  generatedProblems,
  onGeneratedProblemsChange,
}: AIGeneratedCodingSectionProps) {
  const { showToast } = useToast();
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">(
    "Medium"
  );
  const [programmingLanguage, setProgrammingLanguage] = useState("Python");
  const [generating, setGenerating] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const paginatedProblems = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return generatedProblems.slice(startIndex, endIndex);
  }, [generatedProblems, page, limit]);

  const totalPages = Math.max(1, Math.ceil(generatedProblems.length / limit));

  const handleGenerate = async () => {
    if (!topic.trim()) {
      showToast("Please enter a topic", "error");
      return;
    }

    try {
      setGenerating(true);
      const data = await adminAssessmentService.generateCodingProblemsWithAI(
        config.clientId,
        {
          topic: topic.trim(),
          number_of_problems: count,
          difficulty_level: difficulty,
          programming_language: programmingLanguage,
        }
      );

      // The API returns coding_problems array and coding_problem_ids
      // We'll store the problems and add their IDs to the selected list
      const newProblems = data.coding_problems || [];
      const newIds = data.coding_problem_ids || [];

      // Append to existing generated problems (persist to parent state)
      const updatedProblems = [...generatedProblems, ...newProblems];
      onGeneratedProblemsChange(updatedProblems);

      // Add IDs to selected list (avoid duplicates)
      // Merge with existing IDs from prop to ensure we don't lose any
      const updatedIds = [...new Set([...codingProblemIds, ...newIds])];
      onCodingProblemIdsChange(updatedIds);

      showToast(
        data.message ||
          `Successfully generated ${newIds.length} coding problem(s)`,
        "success"
      );

      // Reset to first page if we're not on it
      if (page !== 1) {
        setPage(1);
      }
    } catch (error: any) {
      showToast(
        error?.message || "Failed to generate coding problems",
        "error"
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleRemove = (id: number) => {
    // Remove from generated problems list (persist to parent state)
    const updatedProblems = generatedProblems.filter((p) => p.id !== id);
    onGeneratedProblemsChange(updatedProblems);
    // Remove from selected IDs
    onCodingProblemIdsChange(
      codingProblemIds.filter((selectedId) => selectedId !== id)
    );
  };

  const handleClearAll = () => {
    if (generatedProblems.length === 0) return;
    if (
      confirm(
        `Remove all ${generatedProblems.length} generated coding problems?`
      )
    ) {
      // Remove all IDs from selected list
      const idsToRemove = generatedProblems.map((p) => p.id);
      onCodingProblemIdsChange(
        codingProblemIds.filter((id) => !idsToRemove.includes(id))
      );
      // Clear generated problems (persist to parent state)
      onGeneratedProblemsChange([]);
      showToast("All coding problems removed", "success");
      setPage(1);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        AI Generated Coding Problems
      </Typography>

      <Paper sx={{ p: 3, bgcolor: "#f9fafb" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            fullWidth
            required
            placeholder="e.g., Arrays and Sorting, Dynamic Programming"
            helperText="Enter the topic or subject for coding problem generation"
          />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              label="Number of Problems"
              type="number"
              value={count}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
              fullWidth
              inputProps={{ min: 1, max: 50 }}
            />
            <TextField
              label="Difficulty Level"
              select
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value as "Easy" | "Medium" | "Hard")
              }
              fullWidth
              SelectProps={{
                native: true,
              }}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </TextField>
          </Box>
          <TextField
            label="Programming Language"
            value={programmingLanguage}
            onChange={(e) => setProgrammingLanguage(e.target.value)}
            fullWidth
            placeholder="e.g., Python, Java, JavaScript"
          />
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={generating || !topic.trim()}
            startIcon={
              generating ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <IconWrapper icon="mdi:robot" size={18} />
              )
            }
            sx={{ bgcolor: "#10b981" }}
          >
            {generating ? "Generating..." : "Generate Coding Problems"}
          </Button>
        </Box>
      </Paper>

      {generatedProblems.length > 0 && (
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Generated Coding Problems ({generatedProblems.length})
            </Typography>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={handleClearAll}
              startIcon={<IconWrapper icon="mdi:delete-outline" size={18} />}
            >
              Clear All
            </Button>
          </Box>

          <Paper
            sx={{
              borderRadius: 2,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f9fafb" }}>
                    <TableCell
                      sx={{ fontWeight: 600, fontSize: "0.875rem", width: 48 }}
                    >
                      #
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      Title
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      Difficulty
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      Topic
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      Language
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 600, fontSize: "0.875rem", width: 80 }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedProblems.map((problem, index) => {
                    const globalIndex = (page - 1) * limit + index;
                    return (
                      <TableRow
                        key={problem.id}
                        sx={{
                          "&:hover": { backgroundColor: "#f9fafb" },
                        }}
                      >
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ color: "#6b7280", fontFamily: "monospace" }}
                          >
                            #{globalIndex + 1}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 400 }}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 500, mb: 1 }}
                          >
                            {problem.title}
                          </Typography>
                          {problem.problem_statement && (
                            <Typography
                              variant="caption"
                              sx={{ color: "#6b7280", display: "block" }}
                            >
                              {problem.problem_statement.length > 100
                                ? problem.problem_statement.substring(0, 100) +
                                  "..."
                                : problem.problem_statement}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {problem.difficulty_level ? (
                            <Chip
                              label={problem.difficulty_level}
                              size="small"
                              sx={{
                                bgcolor:
                                  problem.difficulty_level === "Easy"
                                    ? "#fef3c7"
                                    : problem.difficulty_level === "Medium"
                                    ? "#fde68a"
                                    : "#fed7aa",
                                color:
                                  problem.difficulty_level === "Easy"
                                    ? "#92400e"
                                    : problem.difficulty_level === "Medium"
                                    ? "#78350f"
                                    : "#7c2d12",
                                fontWeight: 600,
                                fontSize: "0.75rem",
                              }}
                            />
                          ) : (
                            <Typography
                              variant="body2"
                              sx={{ color: "#9ca3af" }}
                            >
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: "#6b7280" }}>
                            {problem.topic || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: "#6b7280" }}>
                            {problem.programming_language || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleRemove(problem.id)}
                            sx={{ color: "#ef4444" }}
                          >
                            <IconWrapper icon="mdi:delete" size={16} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {generatedProblems.length > 0 && (
              <Box
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  borderTop: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: { xs: 1.5, sm: 2 },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#6b7280",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    }}
                  >
                    Showing{" "}
                    {Math.min(generatedProblems.length, (page - 1) * limit + 1)}{" "}
                    to {Math.min(generatedProblems.length, page * limit)} of{" "}
                    {generatedProblems.length} problems
                  </Typography>
                  <FormControl
                    size="small"
                    sx={{
                      minWidth: { xs: 100, sm: 120 },
                      "& .MuiInputBase-root": {
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      },
                    }}
                  >
                    <Select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                      displayEmpty
                    >
                      <MenuItem value={10}>10 per page</MenuItem>
                      <MenuItem value={25}>25 per page</MenuItem>
                      <MenuItem value={50}>50 per page</MenuItem>
                      <MenuItem value={100}>100 per page</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                  size="small"
                  showFirstButton={false}
                  showLastButton={false}
                  boundaryCount={1}
                  siblingCount={0}
                  disabled={totalPages <= 1}
                  sx={{
                    "& .MuiPaginationItem-root": {
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    },
                  }}
                />
              </Box>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
}
