"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  CircularProgress,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { DifficultyChip } from "@/components/admin/assessment/shared";
import { useToast } from "@/components/common/Toast";
import {
  adminAssessmentService,
  CodingProblemListItem,
} from "@/lib/services/admin/admin-assessment.service";
import { config } from "@/lib/config";
import { ProblemDescription } from "@/components/coding/ProblemDescription";

const DIFFICULTY_LEVELS: Array<"Easy" | "Medium" | "Hard"> = ["Easy", "Medium", "Hard"];
const LANGUAGES = ["Python", "Java", "JavaScript", "C++", "C", "Go", "Ruby", "SQL", "Other"];
const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

/** Section kicker label (redesign recipe): tiny, bold, uppercase, tertiary. */
const kickerSx = {
  fontSize: "0.72rem",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--font-tertiary)",
} as const;

/** Shipped card recipe for containers in the create wizard. */
const cardSx = {
  bgcolor: "var(--card-bg)",
  border: "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)",
  boxShadow: "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.08)",
} as const;

interface RawCodingProblemSectionProps {
  codingProblemIds: number[];
  onCodingProblemIdsChange: (ids: number[]) => void;
  generatedProblems: CodingProblemListItem[];
  onGeneratedProblemsChange: (problems: CodingProblemListItem[]) => void;
}

export function RawCodingProblemSection({
  codingProblemIds,
  onCodingProblemIdsChange,
  generatedProblems,
  onGeneratedProblemsChange,
}: RawCodingProblemSectionProps) {
  const { showToast } = useToast();
  const [rawProblem, setRawProblem] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState<"Easy" | "Medium" | "Hard">("Easy");
  const [programmingLanguage, setProgrammingLanguage] = useState("Python");
  const [customLanguage, setCustomLanguage] = useState("");
  const [generating, setGenerating] = useState(false);
  const [previewProblem, setPreviewProblem] = useState<CodingProblemListItem | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const rawProblemTrimmed = rawProblem.trim();

  const handleGenerate = async () => {
    if (!rawProblemTrimmed) {
      showToast("Enter the problem statement in the text area", "error");
      return;
    }

    try {
      setGenerating(true);
      const languageToSend =
        programmingLanguage === "Other" ? (customLanguage.trim() || "Other") : programmingLanguage;
      const data = await adminAssessmentService.generateCodingProblemsFromRawBatch(
        config.clientId,
        {
          raw_problems: [rawProblemTrimmed],
          difficulty_level: difficultyLevel,
          programming_language: languageToSend,
        }
      );

      const newIds = data.coding_problem_ids || [];
      const newProblems = data.coding_problems || [];

      const updatedIds = [...new Set([...codingProblemIds, ...newIds])];
      onCodingProblemIdsChange(updatedIds);
      onGeneratedProblemsChange([...generatedProblems, ...newProblems]);

      showToast(
        `Successfully created ${newIds.length} coding problem(s)`,
        "success"
      );

      setRawProblem("");
    } catch (error: any) {
      showToast(
        error?.message || "Failed to create coding problem(s)",
        "error"
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            bgcolor: "color-mix(in srgb, var(--accent-indigo) 12%, var(--card-bg) 88%)",
            color: "var(--accent-indigo)",
          }}
        >
          <IconWrapper icon="mdi:text-box-edit-outline" size={20} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              fontFamily: "var(--font-jakarta)",
              color: "var(--font-primary)",
              lineHeight: 1.25,
            }}
          >
            Add Your Problem
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
            Paste your problem statement (title, description, I/O, constraints). One problem per generation.
          </Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ p: 3, borderRadius: "var(--radius-card)", ...cardSx }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography sx={kickerSx}>Problem defaults</Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <FormControl fullWidth size="small">
                <InputLabel>Difficulty (applies to all)</InputLabel>
                <Select
                  value={difficultyLevel}
                  label="Difficulty (applies to all)"
                  onChange={(e) =>
                    setDifficultyLevel(e.target.value as "Easy" | "Medium" | "Hard")
                  }
                >
                  {DIFFICULTY_LEVELS.map((d) => (
                    <MenuItem key={d} value={d}>
                      {d}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Programming language (applies to all)</InputLabel>
                <Select
                  value={
                    LANGUAGES.includes(programmingLanguage)
                      ? programmingLanguage
                      : "Other"
                  }
                  label="Programming language (applies to all)"
                  onChange={(e) => {
                    const v = e.target.value;
                    setProgrammingLanguage(v);
                    if (v !== "Other") setCustomLanguage("");
                  }}
                >
                  {LANGUAGES.map((lang) => (
                    <MenuItem key={lang} value={lang}>
                      {lang}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            {programmingLanguage === "Other" && (
              <TextField
                size="small"
                label="Specify language"
                value={customLanguage}
                onChange={(e) => setCustomLanguage(e.target.value)}
                placeholder="e.g. Rust, Kotlin"
                fullWidth
              />
            )}
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography sx={kickerSx}>Problem statement</Typography>
            <TextField
              label="Problem statement (raw text)"
              value={rawProblem}
              onChange={(e) => setRawProblem(e.target.value)}
              fullWidth
              multiline
              minRows={6}
              maxRows={12}
              placeholder={`Title: Two Sum

Description:
Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.

Input Format:
- First line: space-separated integers (the array nums)
- Second line: integer target

Output Format:
- Two space-separated indices (0-based), or -1 -1 if no solution exists

Example:
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1]
Explanation: Because nums[0] + nums[1] == 9

Constraints:
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- Only one valid answer exists.`}
            />
          </Box>

          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={generating || !rawProblemTrimmed}
            startIcon={
              generating ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <IconWrapper icon="mdi:send" size={18} />
              )
            }
            sx={{
              alignSelf: "flex-start",
              px: 3,
              py: 1,
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
            {generating ? "Creating..." : "Create coding problem(s)"}
          </Button>
        </Box>
      </Paper>

      {generatedProblems.length > 0 && (
        <Box>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              fontFamily: "var(--font-jakarta)",
              color: "var(--font-primary)",
              mb: 1,
            }}
          >
            Created problems{" "}
            <Box
              component="span"
              sx={{ fontFamily: "var(--font-mono)", color: "var(--accent-indigo)" }}
            >
              ({generatedProblems.length})
            </Box>
          </Typography>
          <Paper elevation={0} sx={{ borderRadius: "16px", overflow: "hidden", ...cardSx }}>
            <TableContainer>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "var(--surface)" }}>
                    <TableCell sx={{ fontWeight: 600, width: 48 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Difficulty</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Language</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 100, textAlign: "center" }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {generatedProblems
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((p, idx) => (
                      <TableRow
                        key={p.id}
                        sx={{ "&:hover": { backgroundColor: "var(--surface)" } }}
                      >
                        <TableCell sx={{ color: "var(--font-secondary)", fontFamily: "var(--font-mono)" }}>
                          {page * rowsPerPage + idx + 1}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 280 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                            {p.title || `Problem #${p.id}`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {p.difficulty_level ? (
                            <DifficultyChip level={p.difficulty_level} />
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell sx={{ color: "var(--font-secondary)" }}>
                          {p.programming_language || "-"}
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          <IconButton
                            size="small"
                            onClick={() => setPreviewProblem(p)}
                            sx={{ color: "var(--accent-indigo)" }}
                            title="Preview"
                          >
                            <IconWrapper icon="mdi:eye-outline" size={18} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              onGeneratedProblemsChange(
                                generatedProblems.filter((x) => x.id !== p.id)
                              );
                              onCodingProblemIdsChange(
                                codingProblemIds.filter((id) => id !== p.id)
                              );
                              setPage((prev) =>
                                Math.max(0, Math.min(prev, Math.ceil((generatedProblems.length - 1) / rowsPerPage) - 1))
                              );
                            }}
                            sx={{ color: "var(--error-500)" }}
                            title="Remove"
                          >
                            <IconWrapper icon="mdi:delete-outline" size={18} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={generatedProblems.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
              labelRowsPerPage="Rows:"
              sx={{
                borderTop: "1px solid var(--border-default)",
                "& .MuiTablePagination-displayedRows": {
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.78rem",
                },
              }}
            />
          </Paper>
        </Box>
      )}

      <Dialog
        open={!!previewProblem}
        onClose={() => setPreviewProblem(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: "90vh",
            borderRadius: "16px",
          },
        }}
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
          <IconButton size="small" onClick={() => setPreviewProblem(null)} aria-label="Close">
            <IconWrapper icon="mdi:close" size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {previewProblem && (
            <Box sx={{ overflow: "auto", flex: 1, minHeight: 0 }}>
              <ProblemDescription
                problemData={(() => {
                  const p = previewProblem as Record<string, unknown>;
                  const details: Record<string, unknown> = {
                    ...previewProblem,
                    title: previewProblem.title,
                    name: previewProblem.title,
                    problem_title: previewProblem.title,
                    problem_statement:
                      previewProblem.problem_statement ||
                      (previewProblem as any).description ||
                      "",
                  };
                  if (p.solution && typeof p.solution === "object" && !Array.isArray(p.solution)) {
                    details.pseudo_code = Object.entries(p.solution)
                      .map(([lang, code]) => `[${lang}]\n${code}`)
                      .join("\n\n");
                  }
                  return { content_title: previewProblem.title, details };
                })()}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
