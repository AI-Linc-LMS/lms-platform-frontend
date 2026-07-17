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
  Collapse,
  Pagination,
} from "@mui/material";
import {
  StatusChip,
  DifficultyChip,
  DifficultyBalanceMeter,
} from "@/components/admin/assessment/shared";
import { PerPageSelect } from "@/components/common/PerPageSelect";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { MCQ } from "@/lib/services/admin/admin-assessment.service";
import {
  adminAssessmentService,
  questionGenerationErrorMessage,
} from "@/lib/services/admin/admin-assessment.service";
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
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  // Which question card is expanded to show its explanation (global index).
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  // Always-current view of the live mcqs prop so the generation poll can merge new
  // questions onto whatever the user has since edited/deleted, instead of clobbering
  // them with a baseline frozen when generation started.
  const latestMcqsRef = useRef(mcqs);
  useEffect(() => {
    latestMcqsRef.current = mcqs;
  }, [mcqs]);

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

    const toMCQ = (q: Record<string, unknown>): MCQ => ({
      question_text: String(q.question_text ?? ""),
      option_a: String(q.option_a ?? ""),
      option_b: String(q.option_b ?? ""),
      option_c: String(q.option_c ?? ""),
      option_d: String(q.option_d ?? ""),
      correct_option: (String(q.correct_option ?? "A").toUpperCase() ||
        "A") as MCQ["correct_option"],
      explanation: String(q.explanation ?? ""),
      difficulty_level:
        (q.difficulty_level as MCQ["difficulty_level"]) ?? "Medium",
      topic: String(q.topic ?? topic.trim()),
      skills: String(q.skills ?? ""),
    });

    // The job returns the CUMULATIVE generated set each poll. Rather than freeze a
    // baseline (which would overwrite any edits the user makes while generating), strip
    // only the PREVIOUS generated block (always appended at the tail) off the live list
    // and re-append the new one — user edits to their own questions survive.
    let prevGenCount = 0;
    const applyGenerated = (generated: MCQ[]) => {
      const latest = latestMcqsRef.current;
      const base = latest.slice(0, Math.max(0, latest.length - prevGenCount));
      onMCQsChange([...base, ...generated]);
      prevGenCount = generated.length;
    };
    try {
      setGenerating(true);
      setProgress({ done: 0, total: numberOfQuestions });

      // Batched, resumable generation (P1): start a job and poll it. A timeout can
      // no longer lose the whole run, and questions appear live as batches finish (P7).
      let job = await adminAssessmentService.startQuestionGeneration(config.clientId, {
        question_type: "mcq",
        topic: topic.trim(),
        number_of_questions: numberOfQuestions,
        difficulty_level: difficulty,
      });

      let guard = 0;
      while (job.status !== "completed" && job.status !== "failed" && guard < 300) {
        setProgress({ done: job.completed_items, total: job.total_items || 1 });
        applyGenerated(job.questions.map(toMCQ));
        await new Promise((r) => setTimeout(r, 2000));
        job = await adminAssessmentService.getQuestionGenerationJob(
          config.clientId,
          job.job_id
        );
        guard += 1;
      }

      applyGenerated(job.questions.map(toMCQ));
      if (job.status === "failed") {
        const reason = questionGenerationErrorMessage(job);
        showToast(
          reason ||
            (job.questions.length
              ? `Generation finished with errors: ${job.questions.length} question(s) produced.`
              : "Question generation failed. Please try again shortly."),
          "error"
        );
      } else {
        showToast(
          `Successfully generated ${job.questions.length} question(s)`,
          "success"
        );
      }
      if (page !== 1) {
        setPage(1);
      }
    } catch (error: any) {
      showToast(error?.message || "Failed to generate questions", "error");
    } finally {
      setGenerating(false);
      setProgress(null);
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconWrapper icon="mdi:auto-fix" size={20} color="var(--ai-violet)" />
        <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: "var(--font-jakarta)", color: "var(--font-primary)" }}>
          Generate with AI
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ p: 3, borderRadius: "var(--radius-card)", bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)" }}>
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
              boxShadow: "0 10px 22px -12px color-mix(in srgb, var(--ai-violet) 70%, transparent)",
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
              : `Generate ${numberOfQuestions || ""} question${numberOfQuestions === 1 ? "" : "s"}`}
          </Button>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, px: 0.5 }}>
            <IconWrapper icon="mdi:lightning-bolt-outline" size={15} color="var(--ai-violet)" />
            <Typography variant="caption" sx={{ color: "var(--font-tertiary)", lineHeight: 1.45 }}>
              Generated questions land in a review list with quality checks and duplicate
              detection. Nothing is added until you approve it.
            </Typography>
          </Box>
        </Box>
      </Paper>

      {(mcqs.length > 0 || generating) && (
        <Box>
          {/* Review-list header: counts + difficulty summary + clear-all */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1.5,
              flexWrap: "wrap",
              gap: 1.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography sx={{ fontWeight: 800, fontFamily: "var(--font-jakarta)", fontSize: "1.05rem", color: "var(--font-primary)" }}>
                Generated questions{" "}
                <Box component="span" sx={{ fontFamily: "var(--font-mono)", color: "var(--ai-violet)" }}>
                  {mcqs.length}
                </Box>
              </Typography>
              {(() => {
                const tally = { Easy: 0, Medium: 0, Hard: 0 } as Record<string, number>;
                mcqs.forEach((q) => { if (q.difficulty_level) tally[q.difficulty_level] = (tally[q.difficulty_level] ?? 0) + 1; });
                return (
                  <>
                    {tally.Easy > 0 ? <StatusChip label={`${tally.Easy} easy`} tone="success" /> : null}
                    {tally.Medium > 0 ? <StatusChip label={`${tally.Medium} medium`} tone="warning" /> : null}
                    {tally.Hard > 0 ? <StatusChip label={`${tally.Hard} hard`} tone="error" /> : null}
                  </>
                );
              })()}
            </Box>
            {mcqs.length > 0 ? (
              <Button
                size="small"
                onClick={handleClearAll}
                startIcon={<IconWrapper icon="mdi:delete-outline" size={17} />}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  color: "var(--error-500)",
                  border: "1px solid color-mix(in srgb, var(--error-500) 35%, var(--border-default) 65%)",
                  borderRadius: 2,
                  px: 1.5,
                  "&:hover": { bgcolor: "color-mix(in srgb, var(--error-500) 8%, transparent)" },
                }}
              >
                Clear all
              </Button>
            ) : null}
          </Box>

          {mcqs.length > 0 ? (
            <Box sx={{ mb: 2 }}>
              <DifficultyBalanceMeter
                balance={{
                  easy: mcqs.filter((q) => q.difficulty_level === "Easy").length,
                  medium: mcqs.filter((q) => q.difficulty_level === "Medium").length,
                  hard: mcqs.filter((q) => q.difficulty_level === "Hard").length,
                }}
                height={8}
              />
            </Box>
          ) : null}

          {/* Question cards — appear LIVE with a staggered reveal as batches land */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            {paginatedMCQs.map((mcq, index) => {
              const globalIndex = (page - 1) * limit + index;
              const isOpen = expandedQ === globalIndex;
              const options: Array<["A" | "B" | "C" | "D", string]> = [
                ["A", mcq.option_a],
                ["B", mcq.option_b],
                ["C", mcq.option_c],
                ["D", mcq.option_d],
              ];
              return (
                <Box
                  key={`${globalIndex}-${mcq.question_text.slice(0, 24)}`}
                  sx={{
                    borderRadius: "14px",
                    border: "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)",
                    bgcolor: "var(--card-bg)",
                    boxShadow: "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.08)",
                    p: 2,
                    "@keyframes qReveal": {
                      from: { opacity: 0, transform: "translateY(8px)" },
                      to: { opacity: 1, transform: "none" },
                    },
                    animation: "qReveal 0.4s ease both",
                    animationDelay: `${(index % 10) * 70}ms`,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1, flexWrap: "wrap" }}>
                    <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "0.8rem", color: "var(--ai-violet)" }}>
                      Q{globalIndex + 1}
                    </Typography>
                    <DifficultyChip level={mcq.difficulty_level} />
                    {mcq.topic ? (
                      <StatusChip label={mcq.topic.length > 30 ? mcq.topic.slice(0, 30) + "…" : mcq.topic} tone="neutral" />
                    ) : null}
                    <Box sx={{ flexGrow: 1 }} />
                    {mcq.explanation ? (
                      <IconButton
                        size="small"
                        aria-label={isOpen ? "Hide explanation" : "Show explanation"}
                        onClick={() => setExpandedQ(isOpen ? null : globalIndex)}
                        sx={{ color: "var(--font-tertiary)" }}
                      >
                        <IconWrapper icon={isOpen ? "mdi:chevron-up" : "mdi:chevron-down"} size={19} />
                      </IconButton>
                    ) : null}
                    <IconButton
                      size="small"
                      aria-label="Remove question"
                      onClick={() => handleDelete(index)}
                      sx={{ color: "var(--error-500)" }}
                    >
                      <IconWrapper icon="mdi:delete-outline" size={17} />
                    </IconButton>
                  </Box>

                  <Typography sx={{ fontWeight: 600, color: "var(--font-primary)", lineHeight: 1.45, mb: 1.25 }}>
                    {mcq.question_text}
                  </Typography>

                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 0.75 }}>
                    {options.map(([letter, text]) => {
                      const correct = mcq.correct_option === letter;
                      return (
                        <Box
                          key={letter}
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 1,
                            px: 1.25,
                            py: 0.9,
                            borderRadius: "10px",
                            bgcolor: correct
                              ? "color-mix(in srgb, var(--success-500) 10%, var(--card-bg) 90%)"
                              : "var(--surface)",
                            border: correct
                              ? "1px solid color-mix(in srgb, var(--success-500) 40%, transparent)"
                              : "1px solid transparent",
                          }}
                        >
                          <Box
                            sx={{
                              width: 22,
                              height: 22,
                              borderRadius: "7px",
                              flexShrink: 0,
                              display: "grid",
                              placeItems: "center",
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              fontFamily: "var(--font-mono)",
                              bgcolor: correct ? "var(--success-500)" : "color-mix(in srgb, var(--ai-violet) 10%, var(--card-bg) 90%)",
                              color: correct ? "#fff" : "var(--ai-violet)",
                            }}
                          >
                            {correct ? <IconWrapper icon="mdi:check" size={14} /> : letter}
                          </Box>
                          <Typography variant="body2" sx={{ color: correct ? "var(--font-primary)" : "var(--font-secondary)", fontWeight: correct ? 600 : 400, lineHeight: 1.4 }}>
                            {text}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>

                  {mcq.explanation ? (
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                      <Box
                        sx={{
                          mt: 1.25,
                          p: 1.5,
                          borderRadius: "10px",
                          bgcolor: "color-mix(in srgb, var(--accent-indigo) 6%, var(--card-bg) 94%)",
                          display: "flex",
                          gap: 1,
                          alignItems: "flex-start",
                        }}
                      >
                        <IconWrapper icon="mdi:lightbulb-outline" size={16} color="var(--accent-indigo)" />
                        <Typography variant="body2" sx={{ color: "var(--font-secondary)", lineHeight: 1.5 }}>
                          {mcq.explanation}
                        </Typography>
                      </Box>
                    </Collapse>
                  ) : null}
                </Box>
              );
            })}

            {/* Live "writing…" shimmer while batches are still generating */}
            {generating ? (
              <Box
                sx={{
                  borderRadius: "14px",
                  border: "1.5px dashed color-mix(in srgb, var(--ai-violet) 35%, var(--border-default) 65%)",
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  "@keyframes writingPulse": {
                    "0%": { opacity: 0.55 },
                    "50%": { opacity: 1 },
                    "100%": { opacity: 0.55 },
                  },
                  animation: "writingPulse 1.6s ease-in-out infinite",
                }}
              >
                <CircularProgress size={16} sx={{ color: "var(--ai-violet)" }} />
                <Typography sx={{ fontWeight: 600, color: "var(--ai-violet)" }}>
                  Writing question {mcqs.length + 1}
                  {progress?.total ? ` (batch ${Math.min(progress.done + 1, progress.total)}/${progress.total})` : ""}…
                </Typography>
              </Box>
            ) : null}
          </Box>

          {/* Pagination */}
          {mcqs.length > limit && (
            <Box
              sx={{
                mt: 1.5,
                p: { xs: 1.5, sm: 2 },
                borderRadius: "12px",
                border: "1px solid var(--border-default)",
                bgcolor: "var(--card-bg)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexDirection: { xs: "column", sm: "row" },
                gap: { xs: 1.5, sm: 2 },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="body2" sx={{ color: "var(--font-secondary)", fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                  Showing {Math.min(mcqs.length, (page - 1) * limit + 1)} to {Math.min(mcqs.length, page * limit)} of {mcqs.length} questions
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
                  "& .MuiPaginationItem-root": { fontSize: { xs: "0.75rem", sm: "0.875rem" } },
                  "& .Mui-selected": { bgcolor: "var(--ai-violet) !important", color: "#fff" },
                }}
              />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
