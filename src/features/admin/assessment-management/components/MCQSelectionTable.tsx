import { useState, useMemo } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  Chip,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Tooltip,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { MCQListItem } from "../../../../services/admin/mcqApis";

interface MCQSelectionTableProps {
  mcqs: MCQListItem[];
  selectedIds: Set<number>;
  onToggleSelection: (id: number) => void;
  error?: string;
  onNavigateToMCQBank: () => void;
}

const MCQSelectionTable = ({
  mcqs,
  selectedIds,
  onToggleSelection,
  error,
  onNavigateToMCQBank,
}: MCQSelectionTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter MCQs based on search
  const filteredMCQs = useMemo(() => {
    if (!searchTerm.trim()) return mcqs;
    const search = searchTerm.toLowerCase();
    return mcqs.filter(
      (mcq) =>
        mcq.question_text.toLowerCase().includes(search) ||
        mcq.topic?.toLowerCase().includes(search) ||
        mcq.difficulty_level.toLowerCase().includes(search)
    );
  }, [mcqs, searchTerm]);

  // Paginate filtered MCQs
  const paginatedMCQs = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredMCQs.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredMCQs, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      paginatedMCQs.forEach((mcq) => {
        if (!selectedIds.has(mcq.id)) {
          onToggleSelection(mcq.id);
        }
      });
    } else {
      paginatedMCQs.forEach((mcq) => {
        if (selectedIds.has(mcq.id)) {
          onToggleSelection(mcq.id);
        }
      });
    }
  };

  const isAllSelected =
    paginatedMCQs.length > 0 &&
    paginatedMCQs.every((mcq) => selectedIds.has(mcq.id));

  const isSomeSelected =
    paginatedMCQs.some((mcq) => selectedIds.has(mcq.id)) && !isAllSelected;

  if (mcqs.length === 0) {
    return (
      <Box
        sx={{
          textAlign: "center",
          py: 8,
          bgcolor: "var(--neutral-50)",
          borderRadius: 1,
        }}
      >
        <Typography sx={{ color: "var(--font-secondary)" }}>
          No MCQs available. Create MCQs first from the MCQ Bank page.
        </Typography>
        <Button
          variant="contained"
          onClick={onNavigateToMCQBank}
          sx={{
            mt: 2,
            bgcolor: "var(--primary-500)",
            "&:hover": {
              bgcolor: "var(--primary-700)",
            },
          }}
        >
          Go to MCQ Bank
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Search Bar */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search questions by text, topic, or difficulty..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Selection Summary */}
      <Typography
        sx={{ mb: 2, fontSize: "0.875rem", color: "var(--font-secondary)" }}
      >
        Selected: <strong>{selectedIds.size}</strong> MCQ(s) | Showing:{" "}
        <strong>{filteredMCQs.length}</strong> of <strong>{mcqs.length}</strong>{" "}
        total
      </Typography>

      {/* Table */}
      <TableContainer
        sx={{
          maxHeight: 500,
          border: "1px solid",
          borderColor: "var(--neutral-200)",
          borderRadius: 1,
          mb: 2,
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                padding="checkbox"
                sx={{ bgcolor: "var(--neutral-50)" }}
              >
                <Checkbox
                  indeterminate={isSomeSelected}
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  sx={{
                    color: "var(--primary-500)",
                    "&.Mui-checked": {
                      color: "var(--primary-600)",
                    },
                    "&.MuiCheckbox-indeterminate": {
                      color: "var(--primary-600)",
                    },
                  }}
                />
              </TableCell>
              <TableCell sx={{ bgcolor: "var(--neutral-50)", width: 80 }}>
                ID
              </TableCell>
              <TableCell sx={{ bgcolor: "var(--neutral-50)", minWidth: 300 }}>
                Question
              </TableCell>
              <TableCell sx={{ bgcolor: "var(--neutral-50)", width: 100 }}>
                Correct
              </TableCell>
              <TableCell sx={{ bgcolor: "var(--neutral-50)", width: 130 }}>
                Difficulty
              </TableCell>
              <TableCell sx={{ bgcolor: "var(--neutral-50)", width: 150 }}>
                Topic
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedMCQs.map((mcq) => (
              <TableRow
                key={mcq.id}
                hover
                onClick={() => onToggleSelection(mcq.id)}
                selected={selectedIds.has(mcq.id)}
                sx={{
                  cursor: "pointer",
                  "&.Mui-selected": {
                    bgcolor: "var(--primary-50)",
                  },
                  "&.Mui-selected:hover": {
                    bgcolor: "var(--primary-100)",
                  },
                }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedIds.has(mcq.id)}
                    onChange={() => onToggleSelection(mcq.id)}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      color: "var(--primary-500)",
                      "&.Mui-checked": {
                        color: "var(--primary-600)",
                      },
                    }}
                  />
                </TableCell>
                <TableCell
                  sx={{ color: "var(--font-primary)", fontWeight: 500 }}
                >
                  #{mcq.id}
                </TableCell>
                <TableCell sx={{ color: "var(--font-primary)" }}>
                  <Typography
                    sx={{
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      lineHeight: 1.6,
                    }}
                  >
                    {mcq.question_text}
                  </Typography>
                  {/* Show options preview */}
                  <Box
                    sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}
                  >
                    {[
                      { label: "A", text: mcq.option_a },
                      { label: "B", text: mcq.option_b },
                      { label: "C", text: mcq.option_c },
                      { label: "D", text: mcq.option_d },
                    ].map((opt) => (
                      <Tooltip
                        key={opt.label}
                        title={opt.text}
                        arrow
                        placement="top"
                      >
                        <Chip
                          label={`${opt.label}: ${opt.text.substring(0, 20)}${
                            opt.text.length > 20 ? "..." : ""
                          }`}
                          size="small"
                          sx={{
                            fontSize: "0.7rem",
                            height: "20px",
                            bgcolor:
                              opt.label === mcq.correct_option
                                ? "var(--success-100)"
                                : "var(--neutral-100)",
                            color:
                              opt.label === mcq.correct_option
                                ? "var(--success-600)"
                                : "var(--font-secondary)",
                            fontWeight:
                              opt.label === mcq.correct_option
                                ? "bold"
                                : "normal",
                            cursor: "pointer",
                          }}
                        />
                      </Tooltip>
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={mcq.correct_option}
                    size="small"
                    sx={{
                      bgcolor: "var(--success-100)",
                      color: "var(--success-600)",
                      fontWeight: "bold",
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={mcq.difficulty_level}
                    size="small"
                    sx={{
                      bgcolor:
                        mcq.difficulty_level === "Easy"
                          ? "var(--success-100)"
                          : mcq.difficulty_level === "Medium"
                          ? "var(--warning-100)"
                          : "var(--error-100)",
                      color:
                        mcq.difficulty_level === "Easy"
                          ? "var(--success-500)"
                          : mcq.difficulty_level === "Medium"
                          ? "var(--warning-500)"
                          : "var(--error-600)",
                    }}
                  />
                </TableCell>
                <TableCell sx={{ color: "var(--font-secondary)" }}>
                  {mcq.topic || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={filteredMCQs.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        sx={{
          borderTop: "1px solid",
          borderColor: "var(--neutral-200)",
        }}
      />

      {error && (
        <Typography
          sx={{
            mt: 1,
            fontSize: "0.875rem",
            color: "var(--error-500)",
          }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default MCQSelectionTable;
