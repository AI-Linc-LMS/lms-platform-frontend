"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Pagination,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { MCQ } from "@/lib/services/admin/admin-assessment.service";
import { normalizeEncoding } from "@/lib/utils/text-utils";

interface CSVUploadSectionProps {
  mcqs: MCQ[];
  onMCQsChange: (mcqs: MCQ[]) => void;
}

const DEFAULT_PAGE_SIZE = 10;

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

  /** Parse CSV rows respecting quoted fields (commas, newlines, "" inside quotes). */
  const parseCSVRows = (text: string): string[][] => {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = "";
    let inQuotes = false;
    const len = text.length;

    for (let i = 0; i < len; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (i + 1 < len && text[i + 1] === '"') {
            cell += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cell += c;
        }
        continue;
      }
      if (c === '"') {
        inQuotes = true;
        continue;
      }
      if (c === ",") {
        row.push(cell.trim());
        cell = "";
        continue;
      }
      if (c === "\n" || c === "\r") {
        row.push(cell.trim());
        cell = "";
        if (row.some((x) => x.length > 0)) rows.push(row);
        row = [];
        if (c === "\r" && i + 1 < len && text[i + 1] === "\n") i++;
        continue;
      }
      cell += c;
    }
    row.push(cell.trim());
    if (row.some((x) => x.length > 0)) rows.push(row);
    return rows;
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
        question_text: values[headers.indexOf("question_text")] ?? "",
        option_a: values[headers.indexOf("option_a")] ?? "",
        option_b: values[headers.indexOf("option_b")] ?? "",
        option_c: values[headers.indexOf("option_c")] ?? "",
        option_d: values[headers.indexOf("option_d")] ?? "",
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Bulk Upload from CSV
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={downloadTemplate}
          startIcon={<IconWrapper icon="mdi:download" size={18} />}
        >
          Download Template
        </Button>
      </Box>

      <Paper sx={{ p: 3, bgcolor: "#f9fafb" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
              sx={{ bgcolor: "#6366f1" }}
            >
              Upload CSV File
            </Button>
          </label>
          <Typography variant="caption" color="text.secondary" display="block">
            CSV format: question_text, option_a, option_b, option_c, option_d,
            correct_option, explanation, difficulty_level, topic, skills. Use
            double quotes for fields that contain commas (e.g. &quot;Option A, with comma&quot;).
          </Typography>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {mcqs.length > 0 && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Imported Questions ({mcqs.length})
          </Typography>
          <TableContainer component={Paper} sx={{ maxHeight: 440, overflow: "auto" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f9fafb" }}>
                  <TableCell sx={{ fontWeight: 600 }}>Question</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Option A</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Option B</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Option C</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Option D</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Correct</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Difficulty</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Explanation</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Topic</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Skills</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedMcqs.map((mcq, i) => {
                  const globalIndex = (page - 1) * limit + i;
                  return (
                    <TableRow key={globalIndex}>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 300 }}>
                          {mcq.question_text}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color: mcq.correct_option === "A" ? "#10b981" : "#6b7280",
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
                            color: mcq.correct_option === "B" ? "#10b981" : "#6b7280",
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
                            color: mcq.correct_option === "C" ? "#10b981" : "#6b7280",
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
                            color: mcq.correct_option === "D" ? "#10b981" : "#6b7280",
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
                            fontWeight: 600,
                            color: "#6366f1",
                          }}
                        >
                          {mcq.correct_option}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {mcq.difficulty_level || "Medium"}
                        </Typography>
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
                          sx={{ color: "#ef4444" }}
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
              pt: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {(page - 1) * limit + 1} to{" "}
                {Math.min(totalCount, page * limit)} of {totalCount}
              </Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <MenuItem value={5}>5 per page</MenuItem>
                  <MenuItem value={10}>10 per page</MenuItem>
                  <MenuItem value={25}>25 per page</MenuItem>
                  <MenuItem value={50}>50 per page</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Pagination
              count={pageCount}
              page={page}
              onChange={(_, p) => setPage(p)}
              color="primary"
              size="small"
              showFirstButton={false}
              showLastButton={false}
              boundaryCount={1}
              siblingCount={0}
              disabled={pageCount <= 1}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}

