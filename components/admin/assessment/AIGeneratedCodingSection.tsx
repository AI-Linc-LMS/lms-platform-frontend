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
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import { PerPageSelect } from "@/components/common/PerPageSelect";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import {
  adminAssessmentService,
  CodingProblemListItem,
} from "@/lib/services/admin/admin-assessment.service";
import { config } from "@/lib/config";
import { ProblemDescription } from "@/components/coding/ProblemDescription";

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
  const [previewProblem, setPreviewProblem] = useState<CodingProblemListItem | null>(null);

  const problemDataForPreview = (problem: CodingProblemListItem) => {
    const details: Record<string, unknown> = {
      ...problem,
      title: problem.title,
      name: problem.title,
      problem_title: problem.title,
      problem_statement: problem.problem_statement ?? (problem as any).description ?? "",
    };
    const p = problem as Record<string, unknown>;
    if (p.solution && typeof p.solution === "object" && !Array.isArray(p.solution)) {
      details.pseudo_code = Object.entries(p.solution)
        .map(([lang, code]) => `[${lang}]\n${code}`)
        .join("\n\n");
    }
    return { content_title: problem.title, details };
  };

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

      <Paper sx={{ p: 3, bgcolor: "var(--surface)", border: "1px solid var(--border-default)" }}>
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
              onChange={(e) => setCount(Math.max(0, Number(e.target.value)))}
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
            sx={{
              bgcolor: "var(--success-500)",
              color: "var(--font-light)",
              "&:hover": {
                bgcolor:
                  "color-mix(in srgb, var(--success-500) 86%, var(--accent-indigo-dark))",
              },
              "&.Mui-disabled": {
                color: "var(--font-secondary)",
                backgroundColor:
                  "color-mix(in srgb, var(--success-500) 24%, var(--surface) 76%)",
              },
            }}
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
                    <TableCell
                      sx={{ fontWeight: 600, fontSize: "0.875rem", width: 100, textAlign: "center" }}
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
                            {problem.title}
                          </Typography>
                          {problem.problem_statement && (
                            <Typography
                              variant="caption"
                              sx={{ color: "var(--font-secondary)", display: "block" }}
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
                                    ? "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)"
                                    : problem.difficulty_level === "Medium"
                                    ? "color-mix(in srgb, var(--warning-500) 16%, var(--surface) 84%)"
                                    : "color-mix(in srgb, var(--warning-500) 20%, var(--surface) 80%)",
                                color:
                                  problem.difficulty_level === "Easy"
                                    ? "var(--success-500)"
                                    : problem.difficulty_level === "Medium"
                                    ? "var(--warning-500)"
                                    : "var(--warning-500)",
                                fontWeight: 600,
                                fontSize: "0.75rem",
                              }}
                            />
                          ) : (
                            <Typography
                              variant="body2"
                              sx={{ color: "var(--font-tertiary)" }}
                            >
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                            {problem.tags || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          <IconButton
                            size="small"
                            onClick={() => setPreviewProblem(problem)}
                            sx={{ color: "var(--accent-indigo)" }}
                            title="Preview"
                          >
                            <IconWrapper icon="mdi:eye-outline" size={16} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleRemove(problem.id)}
                            sx={{ color: "var(--error-500)" }}
                            title="Remove"
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
                    {Math.min(generatedProblems.length, (page - 1) * limit + 1)}{" "}
                    to {Math.min(generatedProblems.length, page * limit)} of{" "}
                    {generatedProblems.length} problems
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

      <Dialog
        open={!!previewProblem}
        onClose={() => setPreviewProblem(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { maxHeight: "90vh", borderRadius: 2 } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>Problem Preview</span>
          <IconButton
            size="small"
            onClick={() => setPreviewProblem(null)}
            aria-label="Close"
          >
            <IconWrapper icon="mdi:close" size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{ p: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}
        >
          {previewProblem && (
            <Box sx={{ overflow: "auto", flex: 1, minHeight: 0 }}>
              <ProblemDescription
                problemData={problemDataForPreview(previewProblem)}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
