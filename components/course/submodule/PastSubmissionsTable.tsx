"use client";

import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from "@mui/material";

interface PastSubmissionsTableProps {
  submissions: any[];
  loading: boolean;
  onViewSubmission: (submission: any) => void;
}

export function PastSubmissionsTable({
  submissions,
  loading,
  onViewSubmission,
}: PastSubmissionsTableProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: "#ffffff",
          borderRadius: 2,
          border: "1px solid #e5e7eb",
        }}
      >
        <Typography variant="body2" sx={{ color: "#6b7280" }}>
          Loading submissions...
        </Typography>
      </Paper>
    );
  }

  if (!submissions || submissions.length === 0) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        backgroundColor: "#ffffff",
        borderRadius: 2,
        border: "1px solid #e5e7eb",
        mt: 2,
        overflow: "hidden",
      }}
    >
      <Box sx={{ p: 3, pb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#1a1f2e" }}>
          Past Submissions ({submissions.length})
        </Typography>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: "#f9fafb",
                "& th": {
                  fontWeight: 600,
                  color: "#1a1f2e",
                  fontSize: "0.875rem",
                  borderBottom: "2px solid #e5e7eb",
                  py: 1.5,
                },
              }}
            >
              <TableCell>Submitted Date</TableCell>
              <TableCell>Marks</TableCell>
              <TableCell>Percentage</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submissions
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((submission) => {
                const marks = parseFloat(submission.marks || "0");
                const maxMarks =
                  submission.maximum_marks || submission.marks || 0;
                const percentage =
                  maxMarks > 0 ? Math.round((marks / maxMarks) * 100) : 0;
                const result = submission.result || "submitted";
                const submittedDate =
                  submission.created_at || submission.submitted_at;

                return (
                  <TableRow
                    key={submission.id}
                    sx={{
                      "&:hover": {
                        backgroundColor: "#f9fafb",
                      },
                      "& td": {
                        borderBottom: "1px solid #e5e7eb",
                        py: 2,
                      },
                    }}
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#1a1f2e",
                          fontWeight: 500,
                        }}
                      >
                        {new Date(submittedDate).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#6b7280",
                        }}
                      >
                        {marks} / {maxMarks}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${percentage}%`}
                        size="small"
                        sx={{
                          backgroundColor:
                            percentage >= 80
                              ? "#d1fae5"
                              : percentage >= 60
                              ? "#fef3c7"
                              : "#fee2e2",
                          color:
                            percentage >= 80
                              ? "#065f46"
                              : percentage >= 60
                              ? "#92400e"
                              : "#991b1b",
                          fontWeight: 600,
                          fontSize: "0.8125rem",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          result === "passed"
                            ? "Passed"
                            : result === "failed"
                            ? "Failed"
                            : "Submitted"
                        }
                        size="small"
                        sx={{
                          backgroundColor:
                            result === "passed"
                              ? "#d1fae5"
                              : result === "failed"
                              ? "#fee2e2"
                              : "#f3f4f6",
                          color:
                            result === "passed"
                              ? "#065f46"
                              : result === "failed"
                              ? "#991b1b"
                              : "#4b5563",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => onViewSubmission(submission)}
                        sx={{
                          textTransform: "none",
                          fontSize: "0.8125rem",
                          px: 2,
                          py: 0.5,
                          borderColor: "#6366f1",
                          color: "#6366f1",
                          "&:hover": {
                            borderColor: "#4f46e5",
                            backgroundColor: "#6366f115",
                          },
                        }}
                      >
                        View Submission
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={submissions.length}
        page={page}
        onPageChange={(event, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25, 50]}
        sx={{
          borderTop: "1px solid #e5e7eb",
          "& .MuiTablePagination-toolbar": {
            px: 2,
          },
          "& .MuiTablePagination-selectLabel": {
            fontSize: "0.875rem",
            color: "#6b7280",
          },
          "& .MuiTablePagination-displayedRows": {
            fontSize: "0.875rem",
            color: "#6b7280",
          },
          "& .MuiTablePagination-select": {
            fontSize: "0.875rem",
          },
        }}
      />
    </Paper>
  );
}

