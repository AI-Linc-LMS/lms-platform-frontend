"use client";

import { useMemo, useState } from "react";
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
import type { AssessmentSubjectiveQuestionListItem } from "@/lib/services/admin/admin-assessment.service";

interface SubjectiveQuestionSelectionSectionProps {
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  questions: AssessmentSubjectiveQuestionListItem[];
  loading: boolean;
}

export function SubjectiveQuestionSelectionSection({
  selectedIds,
  onSelectionChange,
  questions,
  loading,
}: SubjectiveQuestionSelectionSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return questions;
    const t = searchTerm.toLowerCase();
    return questions.filter(
      (q) =>
        q.question_text.toLowerCase().includes(t) ||
        (q.question_type && q.question_type.toLowerCase().includes(t))
    );
  }, [questions, searchTerm]);

  const paginated = useMemo(() => {
    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, page, limit]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));

  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((x) => x !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    const pageIds = paginated.map((q) => q.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      onSelectionChange(selectedIds.filter((id) => !pageIds.includes(id)));
    } else {
      onSelectionChange([...new Set([...selectedIds, ...pageIds])]);
    }
  };

  const pageAllSelected =
    paginated.length > 0 && paginated.every((q) => selectedIds.includes(q.id));

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Paper sx={{ p: 1.5, bgcolor: "var(--surface)" }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Selected: {selectedIds.length} | Showing: {filtered.length} of {questions.length}
        </Typography>
      </Paper>
      <TextField
        label="Search"
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
      {filtered.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center", bgcolor: "var(--surface)" }}>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? "No matches" : "No written questions yet. Use Manual Entry or create some in Django admin."}
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ borderRadius: 2, border: "1px solid var(--border-default)", overflow: "hidden" }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "var(--surface)" }}>
                  <TableCell padding="checkbox">
                    <Checkbox checked={pageAllSelected} onChange={handleSelectAll} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Question</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Mode</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Marks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((q) => (
                  <TableRow
                    key={q.id}
                    hover
                    selected={selectedIds.includes(q.id)}
                    sx={{
                      bgcolor: selectedIds.includes(q.id)
                        ? "color-mix(in srgb, var(--warning-500) 10%, var(--card-bg))"
                        : undefined,
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.includes(q.id)}
                        onChange={() => toggle(q.id)}
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: "monospace" }}>#{q.id}</TableCell>
                    <TableCell sx={{ maxWidth: 420 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {q.question_text.length > 160 ? `${q.question_text.slice(0, 160)}…` : q.question_text}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={(q.answer_mode || "text").replace(/_/g, " ")} />
                    </TableCell>
                    <TableCell>{q.max_marks}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
              p: 1.5,
              borderTop: "1px solid var(--border-default)",
            }}
          >
            <PerPageSelect value={limit} onChange={(n) => { setLimit(n); setPage(1); }} />
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, p) => setPage(p)}
              color="primary"
              size="small"
            />
          </Box>
        </Paper>
      )}
    </Box>
  );
}
