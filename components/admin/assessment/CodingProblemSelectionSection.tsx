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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import { PerPageSelect } from "@/components/common/PerPageSelect";
import { IconWrapper } from "@/components/common/IconWrapper";
import { CodingProblemListItem } from "@/lib/services/admin/admin-assessment.service";
import { ProblemDescription } from "@/components/coding/ProblemDescription";
import { EyeIcon } from "lucide-react";

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
  const [previewProblem, setPreviewProblem] = useState<CodingProblemListItem | null>(null);

  const problemDataForPreview = (problem: CodingProblemListItem) => {
    const details = { ...problem } as Record<string, unknown>;
    details.title = problem.title;
    details.name = problem.title;
    details.problem_title = problem.title;
    details.problem_statement = problem.problem_statement ?? (problem as any).description ?? "";
    if (problem.solution && typeof problem.solution === "object" && !Array.isArray(problem.solution)) {
      details.pseudo_code = Object.entries(problem.solution)
        .map(([lang, code]) => `[${lang}]\n${code}`)
        .join("\n\n");
    }
    return {
      content_title: problem.title,
      details,
    };
  };

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
          <Paper
            sx={{
              p: 1.5,
              bgcolor:
                "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)",
            }}
          >
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
        <Paper sx={{ p: 3, textAlign: "center", bgcolor: "var(--surface)" }}>
          <Typography variant="body2" color="text.secondary">
            {searchTerm
              ? "No coding problems found matching your search"
              : "No coding problems available. Please add coding problems first."}
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
                    Title
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    Difficulty
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    Topic
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: 80, textAlign: "center" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedProblems.map((problem) => (
                  <TableRow
                    key={problem.id}
                    sx={{
                      "&:hover": { backgroundColor: "var(--surface)" },
                      backgroundColor: selectedIds.includes(problem.id)
                        ? "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)"
                        : "var(--font-light)",
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
                        sx={{ color: "var(--font-secondary)", fontFamily: "monospace" }}
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
                          sx={{ color: "var(--font-secondary)", display: "block" }}
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
                                ? "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)"
                                : problem.difficulty_level === "Medium"
                                ? "color-mix(in srgb, var(--warning-500) 16%, var(--surface) 84%)"
                                : "color-mix(in srgb, var(--warning-500) 20%, var(--surface) 80%)",
                            color:
                              problem.difficulty_level === "Easy"
                                ? "var(--success-500)"
                                : problem.difficulty_level === "Medium"
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
                        {problem.tags || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                      <IconButton
                            size="small"
                            onClick={() => setPreviewProblem(problem)}
                            sx={{ color: "var(--accent-indigo)" }}
                            title="Preview"
                          >
                            <IconWrapper icon="mdi:eye-outline" size={18} />
                          </IconButton>
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
                  {Math.min(filteredProblems.length, (page - 1) * limit + 1)} to{" "}
                  {Math.min(filteredProblems.length, page * limit)} of{" "}
                  {filteredProblems.length} problems
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

      <Dialog
        open={!!previewProblem}
        onClose={() => setPreviewProblem(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { maxHeight: "90vh", borderRadius: 2 } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
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

