import { useState, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
} from "@mui/icons-material";
import { MCQData, downloadCSVTemplate, parseCSV } from "../types";

interface MCQFormListProps {
  mcqs: MCQData[];
  errors: Record<string, string>;
  onMCQChange: (index: number, field: string, value: string) => void;
  onAddMCQ: () => void;
  onRemoveMCQ: (index: number) => void;
  onBulkAddMCQs?: (mcqs: MCQData[]) => void;
}

const MCQFormList = ({
  mcqs,
  errors,
  onMCQChange,
  onAddMCQ,
  onRemoveMCQ,
  onBulkAddMCQs,
}: MCQFormListProps) => {
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* View Mode Toggle */}
      {mcqs.length > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            sx={{ color: "var(--font-secondary)", fontSize: "0.875rem" }}
          >
            {mcqs.length} question{mcqs.length !== 1 ? "s" : ""} added
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton
              onClick={() => setViewMode("cards")}
              sx={{
                color:
                  viewMode === "cards"
                    ? "var(--primary-600)"
                    : "var(--font-secondary)",
                bgcolor:
                  viewMode === "cards" ? "var(--primary-50)" : "transparent",
                "&:hover": {
                  bgcolor: "var(--primary-100)",
                },
              }}
              title="Card View"
            >
              <ViewModuleIcon />
            </IconButton>
            <IconButton
              onClick={() => setViewMode("table")}
              sx={{
                color:
                  viewMode === "table"
                    ? "var(--primary-600)"
                    : "var(--font-secondary)",
                bgcolor:
                  viewMode === "table" ? "var(--primary-50)" : "transparent",
                "&:hover": {
                  bgcolor: "var(--primary-100)",
                },
              }}
              title="Table View"
            >
              <ViewListIcon />
            </IconButton>
          </Box>
        </Box>
      )}

      {/* Table View */}
      {viewMode === "table" && mcqs.length > 0 && (
        <TableContainer
          component={Paper}
          sx={{ border: "1px solid", borderColor: "var(--neutral-200)" }}
        >
          <Table>
            <TableHead sx={{ bgcolor: "var(--neutral-50)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", width: 70 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: "bold", minWidth: 200 }}>
                  Question
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", width: 120 }}>
                  Option A
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", width: 120 }}>
                  Option B
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", width: 120 }}>
                  Option C
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", width: 120 }}>
                  Option D
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", width: 80 }}>
                  Correct
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", width: 100 }}>
                  Difficulty
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", width: 80 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mcqs.map((mcq, index) => (
                <TableRow key={mcq.id} hover>
                  <TableCell
                    sx={{
                      fontSize: "0.75rem",
                      color: "var(--font-secondary)",
                      fontWeight: "bold",
                    }}
                  >
                    {mcq.id}
                  </TableCell>
                  <TableCell>
                    <Typography
                      sx={{ fontSize: "0.875rem" }}
                      title={mcq.question_text}
                    >
                      {mcq.question_text || (
                        <em style={{ color: "var(--font-tertiary)" }}>-</em>
                      )}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      sx={{ fontSize: "0.875rem" }}
                      title={mcq.option_a}
                    >
                      {mcq.option_a || (
                        <em style={{ color: "var(--font-tertiary)" }}>-</em>
                      )}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      sx={{ fontSize: "0.875rem" }}
                      title={mcq.option_b}
                    >
                      {mcq.option_b || (
                        <em style={{ color: "var(--font-tertiary)" }}>-</em>
                      )}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      sx={{ fontSize: "0.875rem" }}
                      title={mcq.option_c}
                    >
                      {mcq.option_c || (
                        <em style={{ color: "var(--font-tertiary)" }}>-</em>
                      )}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      sx={{ fontSize: "0.875rem" }}
                      title={mcq.option_d}
                    >
                      {mcq.option_d || (
                        <em style={{ color: "var(--font-tertiary)" }}>-</em>
                      )}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={mcq.correct_option}
                      size="small"
                      sx={{
                        bgcolor: "var(--success-100)",
                        color: "var(--success-700)",
                        fontWeight: "bold",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={mcq.difficulty_level}
                      size="small"
                      sx={{
                        bgcolor:
                          mcq.difficulty_level === "Easy"
                            ? "var(--success-100)"
                            : mcq.difficulty_level === "Medium"
                            ? "var(--warning-100)"
                            : "var(--error-100)",
                        color:
                          mcq.difficulty_level === "Easy"
                            ? "var(--success-700)"
                            : mcq.difficulty_level === "Medium"
                            ? "var(--warning-700)"
                            : "var(--error-700)",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => onRemoveMCQ(index)}
                      size="small"
                      sx={{
                        color: "var(--error-500)",
                        "&:hover": {
                          bgcolor: "var(--error-100)",
                        },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Card View */}
      {viewMode === "cards" &&
        mcqs.map((mcq, index) => (
          <Paper
            key={mcq.id}
            sx={{
              p: 3,
              border: "1px solid",
              borderColor: "var(--neutral-200)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontWeight: "bold",
                    color: "var(--font-primary)",
                  }}
                >
                  Question {index + 1}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    color: "var(--font-secondary)",
                  }}
                >
                  ID: {mcq.id}
                </Typography>
              </Box>
              <IconButton
                onClick={() => onRemoveMCQ(index)}
                size="small"
                sx={{
                  color: "var(--error-500)",
                  "&:hover": {
                    bgcolor: "var(--error-100)",
                    color: "var(--error-600)",
                  },
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Question Text"
                value={mcq.question_text}
                onChange={(e) =>
                  onMCQChange(index, "question_text", e.target.value)
                }
                required
                fullWidth
                multiline
                rows={2}
                error={!!errors[`mcq_${index}_question`]}
                helperText={errors[`mcq_${index}_question`]}
                placeholder="Enter question"
              />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <TextField
                  label="Option A"
                  value={mcq.option_a}
                  onChange={(e) =>
                    onMCQChange(index, "option_a", e.target.value)
                  }
                  required
                  fullWidth
                  error={!!errors[`mcq_${index}_options`]}
                  placeholder="Option A"
                />

                <TextField
                  label="Option B"
                  value={mcq.option_b}
                  onChange={(e) =>
                    onMCQChange(index, "option_b", e.target.value)
                  }
                  required
                  fullWidth
                  error={!!errors[`mcq_${index}_options`]}
                  placeholder="Option B"
                />

                <TextField
                  label="Option C"
                  value={mcq.option_c}
                  onChange={(e) =>
                    onMCQChange(index, "option_c", e.target.value)
                  }
                  required
                  fullWidth
                  error={!!errors[`mcq_${index}_options`]}
                  placeholder="Option C"
                />

                <TextField
                  label="Option D"
                  value={mcq.option_d}
                  onChange={(e) =>
                    onMCQChange(index, "option_d", e.target.value)
                  }
                  required
                  fullWidth
                  error={!!errors[`mcq_${index}_options`]}
                  placeholder="Option D"
                />
              </Box>
              {errors[`mcq_${index}_options`] && (
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    color: "var(--error-500)",
                  }}
                >
                  {errors[`mcq_${index}_options`]}
                </Typography>
              )}

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "1fr 1fr 1fr",
                  },
                  gap: 2,
                }}
              >
                <FormControl fullWidth>
                  <InputLabel>Correct Option *</InputLabel>
                  <Select
                    value={mcq.correct_option}
                    onChange={(e) =>
                      onMCQChange(index, "correct_option", e.target.value)
                    }
                    label="Correct Option *"
                  >
                    <MenuItem value="A">A</MenuItem>
                    <MenuItem value="B">B</MenuItem>
                    <MenuItem value="C">C</MenuItem>
                    <MenuItem value="D">D</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Difficulty</InputLabel>
                  <Select
                    value={mcq.difficulty_level}
                    onChange={(e) =>
                      onMCQChange(index, "difficulty_level", e.target.value)
                    }
                    label="Difficulty"
                  >
                    <MenuItem value="Easy">Easy</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="Hard">Hard</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Topic"
                  value={mcq.topic}
                  onChange={(e) => onMCQChange(index, "topic", e.target.value)}
                  fullWidth
                  placeholder="Topic (optional)"
                />
              </Box>

              <TextField
                label="Skills"
                value={mcq.skills}
                onChange={(e) => onMCQChange(index, "skills", e.target.value)}
                fullWidth
                placeholder="Skills (optional)"
              />

              <TextField
                label="Explanation"
                value={mcq.explanation}
                onChange={(e) =>
                  onMCQChange(index, "explanation", e.target.value)
                }
                fullWidth
                multiline
                rows={2}
                placeholder="Explanation (optional)"
              />
            </Box>
          </Paper>
        ))}

      {errors.mcqs && (
        <Typography sx={{ fontSize: "0.875rem", color: "var(--error-500)" }}>
          {errors.mcqs}
        </Typography>
      )}

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={onAddMCQ}
        sx={{
          color: "var(--primary-600)",
          borderColor: "var(--primary-600)",
          "&:hover": {
            borderColor: "var(--primary-700)",
            bgcolor: "var(--primary-50)",
          },
        }}
      >
        Add Question
      </Button>
    </Box>
  );
};

export default MCQFormList;
