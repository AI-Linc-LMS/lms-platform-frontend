"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Checkbox,
  CircularProgress,
  TextField,
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
import { MCQListItem } from "@/lib/services/admin/admin-assessment.service";

interface MCQSelectionSectionProps {
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  mcqs: MCQListItem[];
  loading: boolean;
}

export function MCQSelectionSection({
  selectedIds,
  onSelectionChange,
  mcqs,
  loading,
}: MCQSelectionSectionProps) {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const filteredMCQs = useMemo(() => {
    if (!searchTerm.trim()) return mcqs;
    return mcqs.filter(
      (mcq) =>
        mcq.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mcq.topic?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [mcqs, searchTerm]);

  const paginatedMCQs = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredMCQs.slice(startIndex, endIndex);
  }, [filteredMCQs, page, limit]);

  const totalPages = Math.max(1, Math.ceil(filteredMCQs.length / limit));

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedMCQs.length) {
      // Deselect all on current page
      const pageIds = paginatedMCQs.map((mcq) => mcq.id);
      onSelectionChange(
        selectedIds.filter((id) => !pageIds.includes(id))
      );
    } else {
      // Select all on current page
      const pageIds = paginatedMCQs.map((mcq) => mcq.id);
      onSelectionChange([...new Set([...selectedIds, ...pageIds])]);
    }
  };

  const isAllSelected = paginatedMCQs.length > 0 && paginatedMCQs.every((mcq) => selectedIds.includes(mcq.id));

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Select from Existing Questions
        </Typography>
        {selectedIds.length > 0 && (
          <Paper
            sx={{
              p: 1.5,
              bgcolor:
                "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Selected: {selectedIds.length} MCQ(s) | Showing: {filteredMCQs.length} of {mcqs.length} total
            </Typography>
          </Paper>
        )}
      </Box>

      <TextField
        label="Search Questions"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setPage(1);
        }}
        fullWidth
        size="small"
        InputProps={{
          startAdornment: (
            <IconWrapper icon="mdi:magnify" size={20} style={{ marginRight: 8 }} />
          ),
        }}
      />

      {filteredMCQs.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center", bgcolor: "var(--surface)" }}>
          <Typography variant="body2" color="text.secondary">
            {searchTerm
              ? "No questions found matching your search"
              : "No questions available. Please add questions first."}
          </Typography>
        </Paper>
      ) : (
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
                  <TableCell padding="checkbox" sx={{ width: 48 }}>
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={
                        selectedIds.length > 0 && !isAllSelected
                      }
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    ID
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
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedMCQs.map((mcq) => (
                  <TableRow
                    key={mcq.id}
                    sx={{
                      "&:hover": { backgroundColor: "var(--surface)" },
                      backgroundColor: selectedIds.includes(mcq.id)
                        ? "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)"
                        : "var(--font-light)",
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.includes(mcq.id)}
                        onChange={() => handleToggle(mcq.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ color: "var(--font-secondary)", fontFamily: "monospace" }}
                      >
                        #{mcq.id}
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {filteredMCQs.length > 0 && (
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
                  {Math.min(filteredMCQs.length, (page - 1) * limit + 1)} to{" "}
                  {Math.min(filteredMCQs.length, page * limit)} of{" "}
                  {filteredMCQs.length} questions
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
      )}
    </Box>
  );
}
