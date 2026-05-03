"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
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
import { useToast } from "@/components/common/Toast";
import {
  adminAssessmentService,
  CodingProblemListItem,
} from "@/lib/services/admin/admin-assessment.service";
import { config } from "@/lib/config";
import { ProblemDescription } from "@/components/coding/ProblemDescription";
import { parseCSVRows } from "@/lib/utils/csv-parse";
import { normalizeEncoding } from "@/lib/utils/text-utils";

const DIFFICULTY_LEVELS: Array<"Easy" | "Medium" | "Hard"> = ["Easy", "Medium", "Hard"];
const LANGUAGES = ["Python", "Java", "JavaScript", "C++", "C", "Go", "Ruby", "SQL", "Other"];
const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];
const RAW_BATCH_CHUNK = 20;

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "_");
}

function rowMap(headers: string[], values: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  headers.forEach((h, i) => {
    map[normalizeHeader(h)] = values[i] ?? "";
  });
  return map;
}

function pick(map: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const v = map[k];
    if (v != null && String(v).trim().length > 0) return v;
  }
  return "";
}

/** Build one plain-text problem spec per CSV row (no HTML). Quoted cells preserve newlines and indentation. */
function csvRowToRawProblem(map: Record<string, string>): string | null {
  const raw = pick(map, "raw_problem", "raw", "full_problem");
  if (raw.trim()) return raw;

  const title = pick(map, "title", "problem_title").trim();
  const description = pick(
    map,
    "description",
    "problem_statement",
    "problem_description"
  ).trim();
  const scenario = pick(map, "scenario", "context", "background").trim();

  if (!title && !description && !scenario) return null;

  const parts: string[] = [];
  if (title) parts.push(`Title: ${title}`);
  if (scenario) {
    if (parts.length) parts.push("");
    parts.push(`Scenario:\n${scenario}`);
  }
  if (description) {
    if (parts.length) parts.push("");
    parts.push(description);
  }

  const constraints = pick(map, "constraints", "constraint");
  if (constraints.trim()) {
    parts.push("\n\nConstraints:\n" + constraints);
  }

  const inputSpec = pick(map, "input_spec", "input_format", "input_description");
  if (inputSpec.trim()) {
    parts.push("\n\nInput specification:\n" + inputSpec);
  }

  const outputSpec = pick(map, "output_spec", "output_format", "output_description");
  if (outputSpec.trim()) {
    parts.push("\n\nOutput specification:\n" + outputSpec);
  }

  const sampleInput = pick(map, "sample_input", "example_input");
  if (sampleInput.trim()) {
    parts.push("\n\nSample input:\n```\n" + sampleInput + "\n```");
  }

  const sampleOutput = pick(map, "sample_output", "example_output");
  if (sampleOutput.trim()) {
    parts.push("\n\nSample output:\n```\n" + sampleOutput + "\n```");
  }

  const starter = pick(map, "starter_code", "template_code", "skeleton_code", "initial_code");
  if (starter.trim()) {
    parts.push("\n\nStarter code:\n```\n" + starter + "\n```");
  }

  const assembled = parts.join("");
  return assembled.trim() ? assembled : null;
}

function parseCodingProblemsCsv(csvText: string): string[] {
  const normalized = normalizeEncoding(csvText);
  const rows = parseCSVRows(normalized);
  if (rows.length < 2) {
    throw new Error("CSV file must have a header row and at least one data row");
  }

  const headers = rows[0].map((h) => h.trim());
  const problems: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    if (!values.some((c) => c.trim().length > 0)) continue;
    const map = rowMap(headers, values);
    const raw = csvRowToRawProblem(map);
    if (raw) problems.push(raw);
  }

  if (problems.length === 0) {
    throw new Error(
      "No valid rows: use column raw_problem, or title + description (plus optional scenario, constraints, code columns). See template."
    );
  }

  return problems;
}

interface CodingCSVUploadSectionProps {
  codingProblemIds: number[];
  onCodingProblemIdsChange: (ids: number[]) => void;
  generatedProblems: CodingProblemListItem[];
  onGeneratedProblemsChange: (problems: CodingProblemListItem[]) => void;
}

export function CodingCSVUploadSection({
  codingProblemIds,
  onCodingProblemIdsChange,
  generatedProblems,
  onGeneratedProblemsChange,
}: CodingCSVUploadSectionProps) {
  const { showToast } = useToast();
  const [error, setError] = useState("");
  const [parsedProblems, setParsedProblems] = useState<string[]>([]);
  const [difficultyLevel, setDifficultyLevel] = useState<"Easy" | "Medium" | "Hard">("Easy");
  const [programmingLanguage, setProgrammingLanguage] = useState("Python");
  const [customLanguage, setCustomLanguage] = useState("");
  const [generating, setGenerating] = useState(false);
  const [previewProblem, setPreviewProblem] = useState<CodingProblemListItem | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const previewSnippets = useMemo(
    () =>
      parsedProblems.map((text) => {
        const line = text.split(/\r?\n/).find((l) => l.trim().length > 0) || text;
        return line.length > 120 ? line.slice(0, 117) + "…" : line;
      }),
    [parsedProblems]
  );

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a CSV file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCodingProblemsCsv(text);
        setParsedProblems(parsed);
        setError("");
        showToast(`Parsed ${parsed.length} problem(s) from CSV`, "success");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to parse CSV";
        setError(msg);
        setParsedProblems([]);
        showToast(msg, "error");
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleGenerateFromCsv = async () => {
    if (parsedProblems.length === 0) {
      showToast("Upload a CSV file first", "error");
      return;
    }
    const languageToSend =
      programmingLanguage === "Other" ? (customLanguage.trim() || "Other") : programmingLanguage;

    try {
      setGenerating(true);
      const allIds: number[] = [];
      const allProblems: CodingProblemListItem[] = [];

      for (let i = 0; i < parsedProblems.length; i += RAW_BATCH_CHUNK) {
        const chunk = parsedProblems.slice(i, i + RAW_BATCH_CHUNK);
        const data = await adminAssessmentService.generateCodingProblemsFromRawBatch(
          config.clientId,
          {
            raw_problems: chunk,
            difficulty_level: difficultyLevel,
            programming_language: languageToSend,
          }
        );
        const newIds = data.coding_problem_ids || [];
        const newProblems = (data.coding_problems || []) as CodingProblemListItem[];
        allIds.push(...newIds);
        allProblems.push(...newProblems);
      }

      const updatedIds = [...new Set([...codingProblemIds, ...allIds])];
      onCodingProblemIdsChange(updatedIds);
      onGeneratedProblemsChange([...generatedProblems, ...allProblems]);
      setParsedProblems([]);
      showToast(
        `Successfully created ${allIds.length} coding problem(s) from CSV`,
        "success"
      );
    } catch (error: unknown) {
      const msg =
        error && typeof error === "object" && "message" in error
          ? String((error as { message: string }).message)
          : "Failed to create coding problems from CSV";
      showToast(msg, "error");
    } finally {
      setGenerating(false);
    }
  };

  const downloadTemplate = () => {
    const header =
      "title,description,scenario,constraints,input_spec,output_spec,sample_input,sample_output,starter_code";
    const starterSample = "def solve():\n    a, b = map(int, input().split())\n    print(a + b)";
    const example = [
      '"Sum two integers"',
      '"Read two integers and print their sum."',
      '""',
      '"Each value fits in 32-bit signed int"',
      '"First line: two integers a and b separated by space"',
      '"One integer: a + b"',
      '"3 4"',
      '"7"',
      `"${starterSample.replace(/"/g, '""')}"`,
    ].join(",");
    const blob = new Blob([`${header}\n${example}`], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "coding_problems_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadRawTemplate = () => {
    const header = "raw_problem";
    const multiline = [
      "Title: Example",
      "",
      "Given n, print n.",
      "",
      "Constraints:",
      "1 <= n <= 10^5",
      "",
      "Starter:",
      "```",
      "#include <stdio.h>",
      "int main() {",
      "  return 0;",
      "}",
      "```",
    ].join("\n");
    const body = `"${multiline.replace(/"/g, '""')}"`;
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "coding_problems_raw_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        Bulk upload (CSV)
      </Typography>
      <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
        Use plain text in cells—no HTML. Put multi-line text, code, and indented blocks inside double-quoted
        fields; line breaks and spaces inside quotes are kept. Either use one{" "}
        <Typography component="span" variant="body2" sx={{ fontFamily: "monospace" }}>
          raw_problem
        </Typography>{" "}
        column per row, or structured columns (title, description, scenario, constraints, input_spec,
        output_spec, sample_input, sample_output, starter_code). Optional headers accept aliases such as{" "}
        <Typography component="span" variant="body2" sx={{ fontFamily: "monospace" }}>
          problem_statement
        </Typography>
        ,{" "}
        <Typography component="span" variant="body2" sx={{ fontFamily: "monospace" }}>
          input_format
        </Typography>
        .
      </Typography>

      <Paper sx={{ p: 3, bgcolor: "color-mix(in srgb, var(--surface) 86%, var(--card-bg) 14%)" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Button variant="outlined" size="small" onClick={downloadTemplate} startIcon={<IconWrapper icon="mdi:download" size={18} />}>
              Structured template
            </Button>
            <Button variant="outlined" size="small" onClick={downloadRawTemplate} startIcon={<IconWrapper icon="mdi:download" size={18} />}>
              raw_problem template
            </Button>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <FormControl fullWidth size="small">
              <InputLabel>Difficulty (all rows)</InputLabel>
              <Select
                value={difficultyLevel}
                label="Difficulty (all rows)"
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
              <InputLabel>Programming language (all rows)</InputLabel>
              <Select
                value={LANGUAGES.includes(programmingLanguage) ? programmingLanguage : "Other"}
                label="Programming language (all rows)"
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

          <Divider />

          <input
            accept=".csv"
            style={{ display: "none" }}
            id="coding-csv-upload"
            type="file"
            onChange={handleFileUpload}
          />
          <label htmlFor="coding-csv-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<IconWrapper icon="mdi:upload" size={18} />}
              sx={{ bgcolor: "var(--accent-indigo)", alignSelf: "flex-start" }}
            >
              Upload CSV
            </Button>
          </label>

          {parsedProblems.length > 0 && (
            <Button
              variant="contained"
              onClick={handleGenerateFromCsv}
              disabled={generating}
              startIcon={
                generating ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <IconWrapper icon="mdi:send" size={18} />
                )
              }
              sx={{ bgcolor: "var(--success-500)", alignSelf: "flex-start" }}
            >
              {generating ? "Creating…" : `Create ${parsedProblems.length} problem(s) from CSV`}
            </Button>
          )}
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {parsedProblems.length > 0 && (
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Parsed from CSV ({parsedProblems.length} — not yet created on server)
          </Typography>
          <Paper variant="outlined" sx={{ overflow: "hidden" }}>
            <TableContainer sx={{ maxHeight: 320 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "color-mix(in srgb, var(--surface) 86%, var(--card-bg) 14%)" }}>
                    <TableCell sx={{ fontWeight: 600, width: 56 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>First line / preview</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewSnippets.map((snippet, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontFamily: "monospace", color: "var(--font-secondary)" }}>
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                          {snippet}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

      {generatedProblems.length > 0 && (
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Created problems ({generatedProblems.length})
          </Typography>
          <Paper variant="outlined" sx={{ overflow: "hidden" }}>
            <TableContainer>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "color-mix(in srgb, var(--surface) 86%, var(--card-bg) 14%)" }}>
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
                      <TableRow key={p.id} hover>
                        <TableCell sx={{ color: "var(--font-secondary)", fontFamily: "monospace" }}>
                          {page * rowsPerPage + idx + 1}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 280 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                            {p.title || `Problem #${p.id}`}
                          </Typography>
                        </TableCell>
                        <TableCell>{p.difficulty_level || "—"}</TableCell>
                        <TableCell>{p.programming_language || "—"}</TableCell>
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
                                Math.max(
                                  0,
                                  Math.min(
                                    prev,
                                    Math.ceil((generatedProblems.length - 1) / rowsPerPage) - 1
                                  )
                                )
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
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
                      (previewProblem as { description?: string }).description ||
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
