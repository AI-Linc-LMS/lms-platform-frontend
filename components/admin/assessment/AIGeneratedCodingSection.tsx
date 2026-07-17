"use client";

import { useState, useMemo, useRef, useEffect } from "react";
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
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import { PerPageSelect } from "@/components/common/PerPageSelect";
import { IconWrapper } from "@/components/common/IconWrapper";
import { DifficultyChip } from "@/components/admin/assessment/shared";
import { useToast } from "@/components/common/Toast";
import {
  adminAssessmentService,
  CodingProblemListItem,
  questionGenerationErrorMessage,
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
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
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

  // Always-current views so the poll merges onto live edits instead of a frozen baseline.
  const latestProblemsRef = useRef(generatedProblems);
  const latestIdsRef = useRef(codingProblemIds);
  useEffect(() => {
    latestProblemsRef.current = generatedProblems;
  }, [generatedProblems]);
  useEffect(() => {
    latestIdsRef.current = codingProblemIds;
  }, [codingProblemIds]);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      showToast("Please enter a topic", "error");
      return;
    }

    const toItem = (q: Record<string, unknown>): CodingProblemListItem => ({
      ...(q as CodingProblemListItem),
      id: Number(q.id),
      title: String(q.title ?? "Generated problem"),
      problem_statement: String(q.problem_statement ?? ""),
    });

    // Each poll returns the CUMULATIVE set of persisted problems (with bank ids). Merge
    // onto the LIVE selection (via refs) rather than a frozen baseline, stripping the
    // previous generated block first, so edits/removals made while generating survive.
    let prevGenCount = 0;
    let prevGenIds: number[] = [];
    const applyJob = (job: { questions: Record<string, unknown>[] }) => {
      const withIds = job.questions.filter((q) => q.id != null);
      const newProblems = withIds.map(toItem);
      const newIds = withIds
        .map((q) => Number(q.id))
        .filter((n) => Number.isFinite(n));
      const latestProblems = latestProblemsRef.current;
      const baseProblems = latestProblems.slice(
        0,
        Math.max(0, latestProblems.length - prevGenCount)
      );
      onGeneratedProblemsChange([...baseProblems, ...newProblems]);
      prevGenCount = newProblems.length;
      const baseIds = latestIdsRef.current.filter((id) => !prevGenIds.includes(id));
      onCodingProblemIdsChange([...new Set([...baseIds, ...newIds])]);
      prevGenIds = newIds;
    };

    try {
      setGenerating(true);
      setProgress({ done: 0, total: count });

      // Batched, resumable generation (P1): start a job and poll it (P7 live reveal).
      let job = await adminAssessmentService.startQuestionGeneration(config.clientId, {
        question_type: "coding",
        topic: topic.trim(),
        number_of_questions: count,
        difficulty_level: difficulty,
        programming_language: programmingLanguage,
      });

      let guard = 0;
      while (job.status !== "completed" && job.status !== "failed" && guard < 300) {
        setProgress({ done: job.completed_items, total: job.total_items || 1 });
        applyJob(job);
        await new Promise((r) => setTimeout(r, 2000));
        job = await adminAssessmentService.getQuestionGenerationJob(
          config.clientId,
          job.job_id
        );
        guard += 1;
      }

      applyJob(job);
      const produced = job.questions.filter((q) => q.id != null).length;
      if (job.status === "failed") {
        const reason = questionGenerationErrorMessage(job);
        showToast(
          reason ||
            (produced
              ? `Generation finished with errors: ${produced} problem(s) produced.`
              : "Coding problem generation failed. Please try again shortly."),
          "error"
        );
      } else {
        showToast(`Successfully generated ${produced} coding problem(s)`, "success");
      }
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
      setProgress(null);
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconWrapper icon="mdi:auto-fix" size={20} color="var(--ai-violet)" />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            fontFamily: "var(--font-jakarta)",
            color: "var(--font-primary)",
          }}
        >
          Generate with AI
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: "var(--radius-card)",
          bgcolor: "var(--card-bg)",
          border: "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)",
          boxShadow: "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.08)",
        }}
      >
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
            fullWidth
            onClick={handleGenerate}
            disabled={generating || !topic.trim()}
            startIcon={
              generating ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <IconWrapper icon="mdi:auto-fix" size={18} />
              )
            }
            sx={{
              py: 1.25,
              fontWeight: 700,
              textTransform: "none",
              borderRadius: 2,
              color: "#fff",
              background: "var(--gradient-ai)",
              boxShadow:
                "0 10px 22px -12px color-mix(in srgb, var(--ai-violet) 70%, transparent)",
              "&:hover": { filter: "brightness(1.05)" },
              "&.Mui-disabled": {
                color: "var(--font-secondary)",
                background:
                  "color-mix(in srgb, var(--ai-violet) 18%, var(--surface) 82%)",
              },
            }}
          >
            {generating
              ? progress
                ? `Generating… ${progress.done}/${progress.total} batches`
                : "Generating…"
              : `Generate ${count || ""} coding problem${count === 1 ? "" : "s"}`}
          </Button>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, px: 0.5 }}>
            <IconWrapper icon="mdi:lightning-bolt-outline" size={15} color="var(--ai-violet)" />
            <Typography variant="caption" sx={{ color: "var(--font-tertiary)", lineHeight: 1.45 }}>
              Generated problems are saved to your coding bank and selected for this
              assessment automatically. Preview or remove any of them below.
            </Typography>
          </Box>
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
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontFamily: "var(--font-jakarta)",
                color: "var(--font-primary)",
              }}
            >
              Generated Coding Problems{" "}
              <Box
                component="span"
                sx={{ fontFamily: "var(--font-mono)", color: "var(--ai-violet)" }}
              >
                ({generatedProblems.length})
              </Box>
            </Typography>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={handleClearAll}
              startIcon={<IconWrapper icon="mdi:delete-outline" size={18} />}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
            >
              Clear All
            </Button>
          </Box>

          <Paper
            elevation={0}
            sx={{
              borderRadius: "16px",
              boxShadow:
                "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.08)",
              border: "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)",
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
                            sx={{ color: "var(--font-secondary)", fontFamily: "var(--font-mono)" }}
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
                            <DifficultyChip level={problem.difficulty_level} />
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
                  size="small"
                  showFirstButton={false}
                  showLastButton={false}
                  boundaryCount={1}
                  siblingCount={0}
                  disabled={totalPages <= 1}
                  sx={{
                    "& .MuiPaginationItem-root": {
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      fontFamily: "var(--font-mono)",
                    },
                    "& .MuiPaginationItem-root.Mui-selected": {
                      bgcolor: "var(--accent-indigo)",
                      color: "#fff",
                      "&:hover": { bgcolor: "var(--accent-indigo-dark)" },
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
        PaperProps={{ sx: { maxHeight: "90vh", borderRadius: "16px" } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: "var(--font-jakarta)",
            fontWeight: 700,
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
