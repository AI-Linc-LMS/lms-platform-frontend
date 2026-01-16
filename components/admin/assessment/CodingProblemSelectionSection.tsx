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
import { CodingProblemListItem } from "@/lib/services/admin/admin-assessment.service";

interface CodingProblemSelectionSectionProps {
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  codingProblems: CodingProblemListItem[];
  loading: boolean;
}

export function CodingProblemSelectionSection({
  selectedIds,
  onSelectionChange,
  codingProblems,
  loading,
}: CodingProblemSelectionSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const filteredProblems = useMemo(() => {
    if (!searchTerm.trim()) return codingProblems;
    return codingProblems.filter(
      (problem) =>
        problem.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.problem_statement?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.topic?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [codingProblems, searchTerm]);

  const paginatedProblems = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredProblems.slice(startIndex, endIndex);
  }, [filteredProblems, page, limit]);

  const totalPages = Math.max(1, Math.ceil(filteredProblems.length / limit));

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedProblems.length) {
      // Deselect all on current page
      const pageIds = paginatedProblems.map((problem) => problem.id);
      onSelectionChange(
        selectedIds.filter((id) => !pageIds.includes(id))
      );
    } else {
      // Select all on current page
      const pageIds = paginatedProblems.map((problem) => problem.id);
      onSelectionChange([...new Set([...selectedIds, ...pageIds])]);
    }
  };

  const isAllSelected = paginatedProblems.length > 0 && paginatedProblems.every((problem) => selectedIds.includes(problem.id));

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
          Select from Existing Coding Problems
        </Typography>
        {selectedIds.length > 0 && (
          <Paper sx={{ p: 1.5, bgcolor: "#d1fae5" }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Selected: {selectedIds.length} Problem(s) | Showing: {filteredProblems.length} of {codingProblems.length} total
            </Typography>
          </Paper>
        )}
      </Box>

      <TextField
        label="Search Coding Problems"
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

      {filteredProblems.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center", bgcolor: "#f9fafb" }}>
          <Typography variant="body2" color="text.secondary">
            {searchTerm
              ? "No coding problems found matching your search"
              : "No coding problems available. Please add coding problems first."}
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
                    Title
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    Difficulty
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    Topic
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    Language
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedProblems.map((problem) => (
                  <TableRow
                    key={problem.id}
                    sx={{
                      "&:hover": { backgroundColor: "#f9fafb" },
                      backgroundColor: selectedIds.includes(problem.id)
                        ? "#d1fae5"
                        : "white",
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.includes(problem.id)}
                        onChange={() => handleToggle(problem.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ color: "#6b7280", fontFamily: "monospace" }}
                      >
                        #{problem.id}
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
                          sx={{ color: "#6b7280", display: "block" }}
                        >
                          {problem.problem_statement.length > 100
                            ? problem.problem_statement.substring(0, 100) + "..."
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
                                ? "#fef3c7"
                                : problem.difficulty_level === "Medium"
                                ? "#fde68a"
                                : "#fed7aa",
                            color:
                              problem.difficulty_level === "Easy"
                                ? "#92400e"
                                : problem.difficulty_level === "Medium"
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
                        {problem.topic || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: "#6b7280" }}>
                        {problem.programming_language || "-"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {filteredProblems.length > 0 && (
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
                  {Math.min(filteredProblems.length, (page - 1) * limit + 1)} to{" "}
                  {Math.min(filteredProblems.length, page * limit)} of{" "}
                  {filteredProblems.length} problems
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

