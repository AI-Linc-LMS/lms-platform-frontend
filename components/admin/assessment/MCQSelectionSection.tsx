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
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
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
          <Paper sx={{ p: 1.5, bgcolor: "#eef2ff" }}>
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
        <Paper sx={{ p: 3, textAlign: "center", bgcolor: "#f9fafb" }}>
          <Typography variant="body2" color="text.secondary">
            {searchTerm
              ? "No questions found matching your search"
              : "No questions available. Please add questions first."}
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f9fafb" }}>
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
                      "&:hover": { backgroundColor: "#f9fafb" },
                      backgroundColor: selectedIds.includes(mcq.id)
                        ? "#eef2ff"
                        : "white",
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
                        sx={{ color: "#6b7280", fontFamily: "monospace" }}
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
                                ? "#d1fae5"
                                : "#f3f4f6",
                            color:
                              mcq.correct_option === "A"
                                ? "#065f46"
                                : "#374151",
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
                                ? "#d1fae5"
                                : "#f3f4f6",
                            color:
                              mcq.correct_option === "B"
                                ? "#065f46"
                                : "#374151",
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
                                ? "#d1fae5"
                                : "#f3f4f6",
                            color:
                              mcq.correct_option === "C"
                                ? "#065f46"
                                : "#374151",
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
                                ? "#d1fae5"
                                : "#f3f4f6",
                            color:
                              mcq.correct_option === "D"
                                ? "#065f46"
                                : "#374151",
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
                          bgcolor: "#10b981",
                          color: "#ffffff",
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
                                ? "#fef3c7"
                                : mcq.difficulty_level === "Medium"
                                ? "#fde68a"
                                : "#fed7aa",
                            color:
                              mcq.difficulty_level === "Easy"
                                ? "#92400e"
                                : mcq.difficulty_level === "Medium"
                                ? "#78350f"
                                : "#7c2d12",
                            fontWeight: 600,
                            fontSize: "0.75rem",
                          }}
                        />
                      ) : (
                        <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: "#6b7280" }}>
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
                borderTop: "1px solid #e5e7eb",
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
                    color: "#6b7280",
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  }}
                >
                  Showing{" "}
                  {Math.min(filteredMCQs.length, (page - 1) * limit + 1)} to{" "}
                  {Math.min(filteredMCQs.length, page * limit)} of{" "}
                  {filteredMCQs.length} questions
                </Typography>
                <FormControl
                  size="small"
                  sx={{
                    minWidth: { xs: 100, sm: 120 },
                    "& .MuiInputBase-root": {
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    },
                  }}
                >
                  <Select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    displayEmpty
                  >
                    <MenuItem value={10}>10 per page</MenuItem>
                    <MenuItem value={25}>25 per page</MenuItem>
                    <MenuItem value={50}>50 per page</MenuItem>
                    <MenuItem value={100}>100 per page</MenuItem>
                  </Select>
                </FormControl>
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
