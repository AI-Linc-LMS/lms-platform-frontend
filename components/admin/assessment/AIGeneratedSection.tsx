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
} from "@mui/material";
import { PerPageSelect } from "@/components/common/PerPageSelect";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { MCQ } from "@/lib/services/admin/admin-assessment.service";
import { adminAssessmentService } from "@/lib/services/admin/admin-assessment.service";
import { config } from "@/lib/config";

interface AIGeneratedSectionProps {
  mcqs: MCQ[];
  onMCQsChange: (mcqs: MCQ[]) => void;
}

export function AIGeneratedSection({
  mcqs,
  onMCQsChange,
}: AIGeneratedSectionProps) {
  const { showToast } = useToast();
  const [topic, setTopic] = useState("");
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [generating, setGenerating] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const paginatedMCQs = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return mcqs.slice(startIndex, endIndex);
  }, [mcqs, page, limit]);

  const totalPages = Math.max(1, Math.ceil(mcqs.length / limit));

  const handleGenerate = async () => {
    if (!topic.trim()) {
      showToast("Please enter a topic", "error");
      return;
    }

    try {
      setGenerating(true);
      const data = await adminAssessmentService.generateMCQsWithAI(
        config.clientId,
        {
          topic: topic.trim(),
          number_of_questions: numberOfQuestions,
          difficulty_level: difficulty,
        }
      );

      // Convert AI response to MCQ format and append to existing list
      const generatedMCQs: MCQ[] = data.mcqs.map((mcq) => ({
        question_text: mcq.question_text,
        option_a: mcq.option_a,
        option_b: mcq.option_b,
        option_c: mcq.option_c,
        option_d: mcq.option_d,
        correct_option: mcq.correct_option,
        explanation: mcq.explanation || "",
        difficulty_level: mcq.difficulty_level || "Medium",
        topic: mcq.topic || topic.trim(),
        skills: mcq.skills || "",
      }));

      // Append to existing MCQs instead of replacing
      onMCQsChange([...mcqs, ...generatedMCQs]);
      showToast(
        `Successfully generated ${generatedMCQs.length} question(s)`,
        "success"
      );
      // Reset to first page if we're not on it
      if (page !== 1) {
        setPage(1);
      }
    } catch (error: any) {
      showToast(error?.message || "Failed to generate questions", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = (index: number) => {
    // Calculate the actual index in the full array
    const actualIndex = (page - 1) * limit + index;
    const updated = mcqs.filter((_, i) => i !== actualIndex);
    onMCQsChange(updated);
    // Adjust page if current page becomes empty
    if (updated.length > 0 && Math.ceil(updated.length / limit) < page) {
      setPage(Math.ceil(updated.length / limit));
    }
  };

  const handleClearAll = () => {
    if (mcqs.length === 0) return;
    if (confirm(`Remove all ${mcqs.length} generated questions?`)) {
      onMCQsChange([]);
      showToast("All questions removed", "success");
      setPage(1);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        AI Generated Questions
      </Typography>

      <Paper sx={{ p: 3, bgcolor: "var(--surface)", border: "1px solid var(--border-default)" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            fullWidth
            required
            placeholder="e.g., JavaScript Fundamentals, Data Structures"
            helperText="Enter the topic or subject for question generation"
          />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              label="Number of Questions"
              type="number"
              value={numberOfQuestions}
              onChange={(e) =>
                setNumberOfQuestions(Math.max(0, Number(e.target.value)))
              }
              fullWidth
              inputProps={{ min: 0, max: 50 }}
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
            sx={{
              bgcolor: "var(--accent-indigo)",
              color: "var(--font-light)",
              "&:hover": { bgcolor: "var(--accent-indigo-dark)" },
              "&.Mui-disabled": {
                color: "var(--font-secondary)",
                backgroundColor:
                  "color-mix(in srgb, var(--accent-indigo) 24%, var(--surface) 76%)",
              },
            }}
          >
            {generating ? "Generating..." : "Generate Questions"}
          </Button>
        </Box>
      </Paper>

      {mcqs.length > 0 && (
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
              Generated Questions ({mcqs.length})
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
              boxShadow:
                "0 1px 3px color-mix(in srgb, var(--font-primary) 12%, transparent)",
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--card-bg)",
              overflow: "hidden",
            }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "var(--surface)" }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: 48 }}>
                      #
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      Question
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      Correct
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      Difficulty
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      Topic
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: 80 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedMCQs.map((mcq, index) => {
                    const globalIndex = (page - 1) * limit + index;
                    return (
                      <TableRow
                        key={globalIndex}
                        sx={{
                          "&:hover": { backgroundColor: "var(--surface)" },
                        }}
                      >
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ color: "var(--font-secondary)", fontFamily: "monospace" }}
                          >
                            #{globalIndex + 1}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 400 }}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 500, mb: 1 }}
                          >
                            {mcq.question_text}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 0.5,
                              mt: 1,
                            }}
                          >
                            <Chip
                              label={`A: ${mcq.option_a.length > 30 ? mcq.option_a.substring(0, 30) + "..." : mcq.option_a}`}
                              size="small"
                              sx={{
                                bgcolor:
                                  mcq.correct_option === "A"
                                    ? "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)"
                                    : "var(--surface)",
                                color:
                                  mcq.correct_option === "A"
                                    ? "var(--success-500)"
                                    : "var(--font-primary)",
                                fontWeight: mcq.correct_option === "A" ? 600 : 400,
                                fontSize: "0.75rem",
                                height: 24,
                              }}
                            />
                            <Chip
                              label={`B: ${mcq.option_b.length > 30 ? mcq.option_b.substring(0, 30) + "..." : mcq.option_b}`}
                              size="small"
                              sx={{
                                bgcolor:
                                  mcq.correct_option === "B"
                                    ? "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)"
                                    : "var(--surface)",
                                color:
                                  mcq.correct_option === "B"
                                    ? "var(--success-500)"
                                    : "var(--font-primary)",
                                fontWeight: mcq.correct_option === "B" ? 600 : 400,
                                fontSize: "0.75rem",
                                height: 24,
                              }}
                            />
                            <Chip
                              label={`C: ${mcq.option_c.length > 30 ? mcq.option_c.substring(0, 30) + "..." : mcq.option_c}`}
                              size="small"
                              sx={{
                                bgcolor:
                                  mcq.correct_option === "C"
                                    ? "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)"
                                    : "var(--surface)",
                                color:
                                  mcq.correct_option === "C"
                                    ? "var(--success-500)"
                                    : "var(--font-primary)",
                                fontWeight: mcq.correct_option === "C" ? 600 : 400,
                                fontSize: "0.75rem",
                                height: 24,
                              }}
                            />
                            <Chip
                              label={`D: ${mcq.option_d.length > 30 ? mcq.option_d.substring(0, 30) + "..." : mcq.option_d}`}
                              size="small"
                              sx={{
                                bgcolor:
                                  mcq.correct_option === "D"
                                    ? "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)"
                                    : "var(--surface)",
                                color:
                                  mcq.correct_option === "D"
                                    ? "var(--success-500)"
                                    : "var(--font-primary)",
                                fontWeight: mcq.correct_option === "D" ? 600 : 400,
                                fontSize: "0.75rem",
                                height: 24,
                              }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={mcq.correct_option}
                            size="small"
                            sx={{
                              bgcolor: "var(--success-500)",
                              color: "var(--font-light)",
                              fontWeight: 700,
                              fontSize: "0.875rem",
                              width: 32,
                              height: 32,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {mcq.difficulty_level ? (
                            <Chip
                              label={mcq.difficulty_level}
                              size="small"
                              sx={{
                                bgcolor:
                                  mcq.difficulty_level === "Easy"
                                    ? "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)"
                                    : mcq.difficulty_level === "Medium"
                                    ? "color-mix(in srgb, var(--warning-500) 16%, var(--surface) 84%)"
                                    : "color-mix(in srgb, var(--warning-500) 20%, var(--surface) 80%)",
                                color:
                                  mcq.difficulty_level === "Easy"
                                    ? "var(--success-500)"
                                    : mcq.difficulty_level === "Medium"
                                    ? "var(--warning-500)"
                                    : "var(--warning-500)",
                                fontWeight: 600,
                                fontSize: "0.75rem",
                              }}
                            />
                          ) : (
                            <Typography variant="body2" sx={{ color: "var(--font-tertiary)" }}>
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                            {mcq.topic || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(index)}
                            sx={{ color: "var(--error-500)" }}
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
            {mcqs.length > 0 && (
              <Box
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  borderTop: "1px solid var(--border-default)",
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
                      color: "var(--font-secondary)",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    }}
                  >
                    Showing{" "}
                    {Math.min(mcqs.length, (page - 1) * limit + 1)} to{" "}
                    {Math.min(mcqs.length, page * limit)} of {mcqs.length} questions
                  </Typography>
                  <PerPageSelect
                    value={limit}
                    onChange={(v) => {
                      setLimit(v);
                      setPage(1);
                    }}
                    displayEmpty
                    SelectSx={{ "& .MuiInputBase-root": { fontSize: { xs: "0.75rem", sm: "0.875rem" } } }}
                  />
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
