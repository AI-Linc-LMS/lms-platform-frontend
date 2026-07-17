"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Pagination,
} from "@mui/material";
import { PerPageSelect } from "@/components/common/PerPageSelect";
import { IconWrapper } from "@/components/common/IconWrapper";
import { DifficultyChip } from "@/components/admin/assessment/shared";
import { useToast } from "@/components/common/Toast";
import { MCQ } from "@/lib/services/admin/admin-assessment.service";
import { parseCSVRows } from "@/lib/utils/csv-parse";
import { normalizeEncoding } from "@/lib/utils/text-utils";

interface CSVUploadSectionProps {
  mcqs: MCQ[];
  onMCQsChange: (mcqs: MCQ[]) => void;
}

const DEFAULT_PAGE_SIZE = 10;

/** Section kicker label (redesign language). */
const KICKER_SX = {
  fontSize: "0.72rem",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--font-tertiary)",
} as const;

/** Shipped card recipe for content containers. */
const CARD_SX = {
  borderRadius: "16px",
  bgcolor: "var(--card-bg)",
  border: "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)",
  boxShadow: "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.08)",
} as const;

/** Secondary (outline) button per the redesign button rules. */
const SECONDARY_BUTTON_SX = {
  textTransform: "none",
  fontWeight: 700,
  borderRadius: 2,
  color: "var(--font-primary)",
  borderColor: "var(--border-default)",
  "&:hover": {
    borderColor: "var(--accent-indigo)",
    bgcolor: "color-mix(in srgb, var(--accent-indigo) 6%, var(--card-bg) 94%)",
  },
} as const;

/** Primary (gradient) button per the redesign button rules. */
const PRIMARY_BUTTON_SX = {
  textTransform: "none",
  fontWeight: 700,
  borderRadius: 2,
  color: "#fff",
  background: "var(--gradient-ai)",
  boxShadow:
    "0 10px 22px -12px color-mix(in srgb, var(--ai-violet) 70%, transparent)",
  "&:hover": { filter: "brightness(1.05)" },
} as const;

/** Sticky-header table head cell (token surface, no MUI default grey/blue). */
const HEAD_CELL_SX = {
  fontWeight: 700,
  fontSize: "0.75rem",
  letterSpacing: "0.02em",
  color: "var(--font-secondary)",
  bgcolor: "var(--surface)",
  whiteSpace: "nowrap",
} as const;

export function CSVUploadSection({
  mcqs,
  onMCQsChange,
}: CSVUploadSectionProps) {
  const { showToast } = useToast();
  const [error, setError] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [mcqs.length]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);
        onMCQsChange(parsed);
        setError("");
        showToast(`Successfully imported ${parsed.length} questions`, "success");
      } catch (err: any) {
        setError(err.message || "Failed to parse CSV file");
        showToast("Failed to parse CSV file", "error");
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const parseCSV = (csvText: string): MCQ[] => {
    const normalized = normalizeEncoding(csvText);
    const rows = parseCSVRows(normalized);
    if (rows.length < 2) {
      throw new Error("CSV file must have at least a header and one data row");
    }

    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const requiredHeaders = [
      "question_text",
      "option_a",
      "option_b",
      "option_c",
      "option_d",
      "correct_option",
    ];

    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(
        `Missing required columns: ${missingHeaders.join(", ")}`
      );
    }

    const mcqs: MCQ[] = [];
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i];
      const mcq: MCQ = {
        question_text: (values[headers.indexOf("question_text")] ?? "").replace(/\\n/g, "\n"),
        option_a: (values[headers.indexOf("option_a")] ?? "").replace(/\\n/g, "\n"),
        option_b: (values[headers.indexOf("option_b")] ?? "").replace(/\\n/g, "\n"),
        option_c: (values[headers.indexOf("option_c")] ?? "").replace(/\\n/g, "\n"),
        option_d: (values[headers.indexOf("option_d")] ?? "").replace(/\\n/g, "\n"),
        correct_option: (() => {
          const v = values[headers.indexOf("correct_option")]?.trim().toUpperCase()?.[0] || "A";
          return ["A", "B", "C", "D"].includes(v) ? (v as "A" | "B" | "C" | "D") : "A";
        })(),
        explanation: headers.includes("explanation")
          ? (values[headers.indexOf("explanation")] ?? "")
          : "",
        difficulty_level: headers.includes("difficulty_level")
          ? (values[headers.indexOf("difficulty_level")] as "Easy" | "Medium" | "Hard") || "Medium"
          : "Medium",
        topic: headers.includes("topic") ? (values[headers.indexOf("topic")] ?? "") : "",
        skills: headers.includes("skills") ? (values[headers.indexOf("skills")] ?? "") : "",
      };

      if (
        !mcq.question_text ||
        !mcq.option_a ||
        !mcq.option_b ||
        !mcq.option_c ||
        !mcq.option_d
      ) {
        continue;
      }

      mcqs.push(mcq);
    }

    if (mcqs.length === 0) {
      throw new Error("No valid questions found in CSV file");
    }

    return mcqs;
  };

  const handleDelete = (index: number) => {
    const updated = mcqs.filter((_, i) => i !== index);
    onMCQsChange(updated);
  };

  const totalCount = mcqs.length;
  const paginatedMcqs = useMemo(() => {
    const start = (page - 1) * limit;
    return mcqs.slice(start, start + limit);
  }, [mcqs, page, limit]);
  const pageCount = Math.max(1, Math.ceil(totalCount / limit));

  const downloadTemplate = () => {
    const template = `question_text,option_a,option_b,option_c,option_d,correct_option,explanation,difficulty_level,topic,skills`;
    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mcq_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography sx={KICKER_SX}>Bulk upload from CSV</Typography>

      {/* Dropzone: dashed import card (redesign language) */}
      <Box
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: "var(--radius-card)",
          border:
            "1.5px dashed color-mix(in srgb, var(--ai-violet) 40%, var(--border-default) 60%)",
          bgcolor: "color-mix(in srgb, var(--ai-violet) 3%, var(--card-bg) 97%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            bgcolor: "color-mix(in srgb, var(--ai-violet) 12%, var(--card-bg) 88%)",
            color: "var(--ai-violet)",
          }}
        >
          <IconWrapper icon="mdi:tray-arrow-down" size={22} />
        </Box>
        <Box>
          <Typography
            sx={{
              fontFamily: "var(--font-jakarta)",
              fontWeight: 800,
              fontSize: "1.05rem",
              color: "var(--font-primary)",
            }}
          >
            Import a spreadsheet
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "var(--font-tertiary)",
              display: "block",
              maxWidth: 560,
              mx: "auto",
              mt: 0.5,
              lineHeight: 1.5,
            }}
          >
            CSV format: question_text, option_a, option_b, option_c, option_d,
            correct_option, explanation, difficulty_level, topic, skills. Use
            double quotes for fields that contain commas (e.g. &quot;Option A, with comma&quot;).
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1.25 }}>
          <Button
            variant="outlined"
            onClick={downloadTemplate}
            startIcon={<IconWrapper icon="mdi:download" size={18} />}
            sx={SECONDARY_BUTTON_SX}
          >
            Download Template
          </Button>
          <input
            accept=".csv"
            style={{ display: "none" }}
            id="csv-upload"
            type="file"
            onChange={handleFileUpload}
          />
          <label htmlFor="csv-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<IconWrapper icon="mdi:upload" size={18} />}
              sx={PRIMARY_BUTTON_SX}
            >
              Upload CSV File
            </Button>
          </label>
        </Box>
      </Box>

      {error && (
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1.25,
            p: 2,
            borderRadius: "12px",
            border: "1px solid color-mix(in srgb, var(--error-500) 35%, transparent)",
            bgcolor: "color-mix(in srgb, var(--error-500) 8%, var(--card-bg) 92%)",
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              bgcolor: "color-mix(in srgb, var(--error-500) 12%, var(--card-bg) 88%)",
              color: "var(--error-500)",
            }}
          >
            <IconWrapper icon="mdi:alert-circle-outline" size={20} />
          </Box>
          <Box sx={{ flexGrow: 1, minWidth: 0, pt: 0.25 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--error-500)" }}>
              CSV import failed
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--font-secondary)", wordBreak: "break-word" }}>
              {error}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setError("")}
            aria-label="Dismiss error"
            sx={{ color: "var(--error-500)" }}
          >
            <IconWrapper icon="mdi:close" size={16} />
          </IconButton>
        </Box>
      )}

      {mcqs.length > 0 && (
        <Box>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 1.5 }}>
            <Typography sx={KICKER_SX}>Imported questions</Typography>
            <Typography
              sx={{
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: "0.95rem",
                lineHeight: 1,
                color: "var(--accent-indigo)",
              }}
            >
              {mcqs.length}
            </Typography>
          </Box>
          <Box sx={{ ...CARD_SX, overflow: "hidden" }}>
            <TableContainer sx={{ maxHeight: 440, overflow: "auto" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={HEAD_CELL_SX}>Question</TableCell>
                    <TableCell sx={HEAD_CELL_SX}>Option A</TableCell>
                    <TableCell sx={HEAD_CELL_SX}>Option B</TableCell>
                    <TableCell sx={HEAD_CELL_SX}>Option C</TableCell>
                    <TableCell sx={HEAD_CELL_SX}>Option D</TableCell>
                    <TableCell sx={HEAD_CELL_SX}>Correct</TableCell>
                    <TableCell sx={HEAD_CELL_SX}>Difficulty</TableCell>
                    <TableCell sx={HEAD_CELL_SX}>Explanation</TableCell>
                    <TableCell sx={HEAD_CELL_SX}>Topic</TableCell>
                    <TableCell sx={HEAD_CELL_SX}>Skills</TableCell>
                    <TableCell sx={HEAD_CELL_SX}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedMcqs.map((mcq, i) => {
                    const globalIndex = (page - 1) * limit + i;
                    return (
                      <TableRow
                        key={globalIndex}
                        sx={{ "&:hover": { backgroundColor: "var(--surface)" } }}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 300, whiteSpace: "pre-wrap" }}>
                            {mcq.question_text}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              color: mcq.correct_option === "A" ? "var(--success-500)" : "var(--font-secondary)",
                              fontWeight: mcq.correct_option === "A" ? 600 : 400,
                            }}
                          >
                            {mcq.option_a}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              color: mcq.correct_option === "B" ? "var(--success-500)" : "var(--font-secondary)",
                              fontWeight: mcq.correct_option === "B" ? 600 : 400,
                            }}
                          >
                            {mcq.option_b}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              color: mcq.correct_option === "C" ? "var(--success-500)" : "var(--font-secondary)",
                              fontWeight: mcq.correct_option === "C" ? 600 : 400,
                            }}
                          >
                            {mcq.option_c}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              color: mcq.correct_option === "D" ? "var(--success-500)" : "var(--font-secondary)",
                              fontWeight: mcq.correct_option === "D" ? 600 : 400,
                            }}
                          >
                            {mcq.option_d}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "var(--font-mono)",
                              fontWeight: 700,
                              color: "var(--accent-indigo)",
                            }}
                          >
                            {mcq.correct_option}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <DifficultyChip level={mcq.difficulty_level || "Medium"} />
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 220,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={mcq.explanation || ""}
                          >
                            {mcq.explanation || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 140,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={mcq.topic || ""}
                          >
                            {mcq.topic || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 140,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={mcq.skills || ""}
                          >
                            {mcq.skills || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(globalIndex)}
                            sx={{ color: "var(--error-500)" }}
                            aria-label="Delete question"
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
            <Box
              sx={{
                px: 2,
                py: 1.5,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
                borderTop: "1px solid var(--border-default)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                  Showing {(page - 1) * limit + 1} to{" "}
                  {Math.min(totalCount, page * limit)} of {totalCount}
                </Typography>
                <PerPageSelect
                  value={limit}
                  onChange={(v) => {
                    setLimit(v);
                    setPage(1);
                  }}
                  options={[5, 10, 25, 50]}
                />
              </Box>
              <Pagination
                count={pageCount}
                page={page}
                onChange={(_, p) => setPage(p)}
                size="small"
                showFirstButton={false}
                showLastButton={false}
                boundaryCount={1}
                siblingCount={0}
                disabled={pageCount <= 1}
                sx={{
                  "& .MuiPaginationItem-root": { color: "var(--font-secondary)" },
                  "& .MuiPaginationItem-root.Mui-selected": {
                    bgcolor: "var(--accent-indigo)",
                    color: "#fff",
                    "&:hover": { bgcolor: "var(--accent-indigo)" },
                  },
                }}
              />
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
