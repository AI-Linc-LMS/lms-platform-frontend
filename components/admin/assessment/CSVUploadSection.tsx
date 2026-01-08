"use client";

import { useState } from "react";
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
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { MCQ } from "@/lib/services/admin/admin-assessment.service";

interface CSVUploadSectionProps {
  mcqs: MCQ[];
  onMCQsChange: (mcqs: MCQ[]) => void;
}

export function CSVUploadSection({
  mcqs,
  onMCQsChange,
}: CSVUploadSectionProps) {
  const { showToast } = useToast();
  const [error, setError] = useState<string>("");

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
    reader.readAsText(file);
  };

  const parseCSV = (csvText: string): MCQ[] => {
    const lines = csvText.split("\n").filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error("CSV file must have at least a header and one data row");
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const requiredHeaders = [
      "question_text",
      "option_a",
      "option_b",
      "option_c",
      "option_d",
      "correct_option",
    ];

    // Check if all required headers are present
    const missingHeaders = requiredHeaders.filter(
      (h) => !headers.includes(h)
    );
    if (missingHeaders.length > 0) {
      throw new Error(
        `Missing required columns: ${missingHeaders.join(", ")}`
      );
    }

    const mcqs: MCQ[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const mcq: MCQ = {
        question_text: values[headers.indexOf("question_text")] || "",
        option_a: values[headers.indexOf("option_a")] || "",
        option_b: values[headers.indexOf("option_b")] || "",
        option_c: values[headers.indexOf("option_c")] || "",
        option_d: values[headers.indexOf("option_d")] || "",
        correct_option: (values[headers.indexOf("correct_option")] ||
          "A") as "A" | "B" | "C" | "D",
        explanation: headers.includes("explanation")
          ? values[headers.indexOf("explanation")]
          : "",
        difficulty_level: headers.includes("difficulty_level")
          ? (values[headers.indexOf("difficulty_level")] as "Easy" | "Medium" | "Hard")
          : "Medium",
        topic: headers.includes("topic")
          ? values[headers.indexOf("topic")]
          : "",
        skills: headers.includes("skills")
          ? values[headers.indexOf("skills")]
          : "",
      };

      // Validate required fields
      if (
        !mcq.question_text ||
        !mcq.option_a ||
        !mcq.option_b ||
        !mcq.option_c ||
        !mcq.option_d
      ) {
        continue; // Skip invalid rows
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
          <Typography variant="caption" color="text.secondary">
            CSV format: question_text, option_a, option_b, option_c, option_d,
            correct_option, explanation, difficulty_level, topic, skills
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
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f9fafb" }}>
                  <TableCell sx={{ fontWeight: 600 }}>Question</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Option A</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Option B</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Option C</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Option D</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Correct Answer</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Difficulty</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mcqs.map((mcq, index) => (
                  <TableRow key={index}>
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
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(index)}
                        sx={{ color: "#ef4444" }}
                      >
                        <IconWrapper icon="mdi:delete" size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}

