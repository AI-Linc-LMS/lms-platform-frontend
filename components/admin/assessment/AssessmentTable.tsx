"use client";

import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { Assessment } from "@/lib/services/admin/admin-assessment.service";

interface AssessmentTableProps {
  assessments: Assessment[];
  onEdit: (assessmentId: number) => void;
  onDelete: (assessmentId: number, title: string) => void;
}

export function AssessmentTable({
  assessments,
  onEdit,
  onDelete,
}: AssessmentTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#f9fafb" }}>
            <TableCell
              sx={{
                fontWeight: 600,
                color: "#374151",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              }}
            >
              Title
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 600,
                color: "#374151",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                display: { xs: "none", md: "table-cell" },
              }}
            >
              Duration
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 600,
                color: "#374151",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                display: { xs: "none", sm: "table-cell" },
              }}
            >
              Questions
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 600,
                color: "#374151",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                display: { xs: "none", lg: "table-cell" },
              }}
            >
              Status
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 600,
                color: "#374151",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                display: { xs: "none", md: "table-cell" },
              }}
            >
              Created
            </TableCell>
            {/* <TableCell
              sx={{
                fontWeight: 600,
                color: "#374151",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              }}
            >
              Actions
            </TableCell> */}
          </TableRow>
        </TableHead>
        <TableBody>
          {assessments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No assessments found
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            assessments.map((assessment) => (
              <TableRow
                key={assessment.id}
                sx={{
                  "&:hover": { backgroundColor: "#f9fafb" },
                }}
              >
                <TableCell>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        color: "#111827",
                        fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                      }}
                    >
                      {assessment.title}
                    </Typography>
                    {assessment.is_paid && assessment.price && (
                      <Chip
                        label={`₹${assessment.price}`}
                        size="small"
                        sx={{
                          mt: 0.5,
                          bgcolor: "#fef3c7",
                          color: "#92400e",
                          fontSize: "0.7rem",
                          height: 20,
                        }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#6b7280",
                      fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                    }}
                  >
                    {formatDuration(assessment.duration_minutes)}
                  </Typography>
                </TableCell>
                <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#6b7280",
                      fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                    }}
                  >
                    {assessment.total_questions}
                  </Typography>
                </TableCell>
                <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>
                  <Chip
                    label={assessment.is_active ? "Active" : "Inactive"}
                    size="small"
                    sx={{
                      bgcolor: assessment.is_active ? "#d1fae5" : "#fee2e2",
                      color: assessment.is_active ? "#065f46" : "#991b1b",
                      fontWeight: 600,
                      fontSize: { xs: "0.7rem", sm: "0.75rem" },
                      height: { xs: 20, sm: 24 },
                    }}
                  />
                </TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#6b7280",
                      fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                    }}
                  >
                    {formatDate(assessment.created_at)}
                  </Typography>
                </TableCell>
                {/* <TableCell>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => onEdit(assessment.id)}
                      sx={{ color: "#6366f1" }}
                    >
                      <IconWrapper icon="mdi:pencil" size={18} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => onDelete(assessment.id, assessment.title)}
                      sx={{ color: "#ef4444" }}
                    >
                      <IconWrapper icon="mdi:delete" size={18} />
                    </IconButton>
                  </Box>
                </TableCell> */}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
