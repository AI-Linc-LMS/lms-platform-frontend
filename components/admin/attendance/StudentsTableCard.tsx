"use client";

import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Pagination,
  Avatar,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { PerPageSelect } from "@/components/common/PerPageSelect";
import { IconWrapper } from "@/components/common/IconWrapper";
import { AttendanceActivity } from "@/lib/services/admin/admin-attendance.service";

interface StudentsTableCardProps {
  activity: AttendanceActivity;
  studentsPage: number;
  studentsLimit: number;
  onStudentsPageChange: (page: number) => void;
  onStudentsLimitChange: (limit: number) => void;
}

export function StudentsTableCard({
  activity,
  studentsPage,
  studentsLimit,
  onStudentsPageChange,
  onStudentsLimitChange,
}: StudentsTableCardProps) {
  const { t } = useTranslation("common");
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const attendees = activity.attendees || [];
  const studentsTotalPages = Math.ceil(attendees.length / studentsLimit);
  const startIndex = (studentsPage - 1) * studentsLimit;
  const endIndex = startIndex + studentsLimit;
  const paginatedStudents = attendees.slice(startIndex, endIndex);

  return (
    <Paper
      sx={{
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <Box sx={{ p: { xs: 2, sm: 3 }, pb: 2 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600, 
            color: "#111827",
            fontSize: { xs: "1rem", sm: "1.25rem" },
          }}
        >
          {t("adminAttendance.studentsCount", { count: attendees.length })}
        </Typography>
      </Box>
      {attendees.length === 0 ? (
        <Box
          sx={{
            py: 6,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          <IconWrapper
            icon="mdi:account-off-outline"
            size={48}
            color="#d1d5db"
          />
          <Typography
            variant="body1"
            sx={{ color: "#6b7280", fontWeight: 500 }}
          >
            {t("adminAttendance.noAttendeesYet")}
          </Typography>
          <Typography variant="caption" sx={{ color: "#9ca3af" }}>
            {t("adminAttendance.studentsAppearWhenMarked")}
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer
            sx={{
              overflowX: "auto",
              "&::-webkit-scrollbar": {
                height: 8,
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#f1f1f1",
                borderRadius: 4,
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#c1c1c1",
                borderRadius: 4,
                "&:hover": {
                  backgroundColor: "#a8a8a8",
                },
              },
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f9fafb" }}>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      color: "#374151",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      py: { xs: 1, sm: 1.5 },
                    }}
                  >
                    {t("adminAttendance.name")}
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      color: "#374151",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      py: { xs: 1, sm: 1.5 },
                      display: { xs: "none", sm: "table-cell" },
                    }}
                  >
                    {t("adminAttendance.email")}
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      color: "#374151",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      py: { xs: 1, sm: 1.5 },
                    }}
                  >
                    {t("adminAttendance.status")}
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      color: "#374151",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      py: { xs: 1, sm: 1.5 },
                      display: { xs: "none", md: "table-cell" },
                    }}
                  >
                    {t("adminAttendance.markedAt")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedStudents.map((student) => (
                  <TableRow
                    key={student.id}
                    sx={{
                      "&:hover": { backgroundColor: "#f9fafb" },
                    }}
                  >
                    <TableCell sx={{ py: { xs: 1.5, sm: 2 } }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: { xs: 1, sm: 1.5 },
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: "#6366f1",
                            width: { xs: 28, sm: 32 },
                            height: { xs: 28, sm: 32 },
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          }}
                        >
                          {getInitials(student.user_name)}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{ 
                              fontWeight: 500,
                              fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                            }}
                          >
                            {student.user_name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ 
                              color: "#6b7280",
                              fontSize: { xs: "0.7rem", sm: "0.75rem" },
                              display: { xs: "block", sm: "none" },
                            }}
                          >
                            {student.user_email}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ 
                              color: "#6b7280",
                              fontSize: { xs: "0.7rem", sm: "0.75rem" },
                              display: { xs: "block", md: "none" },
                              mt: { xs: 0.5, md: 0 },
                            }}
                          >
                            {formatDate(student.marked_at)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        py: { xs: 1.5, sm: 2 },
                        display: { xs: "none", sm: "table-cell" },
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: "#6b7280",
                          fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                        }}
                      >
                        {student.user_email}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: { xs: 1.5, sm: 2 } }}>
                      <Chip
                        label={t("adminAttendance.present")}
                        size="small"
                        sx={{
                          bgcolor: "#d1fae5",
                          color: "#065f46",
                          fontWeight: 600,
                          fontSize: { xs: "0.7rem", sm: "0.75rem" },
                          height: { xs: 20, sm: 24 },
                        }}
                      />
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        py: { xs: 1.5, sm: 2 },
                        display: { xs: "none", md: "table-cell" },
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: "#6b7280",
                          fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                        }}
                      >
                        {formatDate(student.marked_at)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box
            sx={{
              p: { xs: 1.5, sm: 2 },
              pt: 2,
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
                gap: { xs: 0.75, sm: 1 },
                flexWrap: "wrap",
                width: { xs: "100%", sm: "auto" },
                justifyContent: { xs: "space-between", sm: "flex-start" },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "#6b7280",
                  fontSize: { xs: "0.7rem", sm: "0.875rem" },
                }}
              >
                {t("adminAttendance.showingXToYOfZStudents", {
                  start: Math.min(attendees.length, startIndex + 1),
                  end: Math.min(attendees.length, endIndex),
                  total: attendees.length,
                })}
              </Typography>
              <PerPageSelect
                value={studentsLimit}
                onChange={(v) => {
                  onStudentsLimitChange(v);
                  onStudentsPageChange(1);
                }}
                options={[5, 10, 25, 50]}
                displayEmpty
                ariaLabel="Students per page"
                MenuItemSx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}
                SelectSx={{
                  fontSize: { xs: "0.7rem", sm: "0.875rem" },
                  "& .MuiSelect-select": { py: { xs: 0.5, sm: 1 }, px: { xs: 0.75, sm: 1.5 } },
                }}
              />
            </Box>

            <Pagination
              count={Math.max(1, studentsTotalPages)}
              page={studentsPage}
              onChange={(_, value) => onStudentsPageChange(value)}
              color="primary"
              size="small"
              showFirstButton={false}
              showLastButton={false}
              disabled={studentsTotalPages <= 1}
              sx={{
                "& .MuiPaginationItem-root": {
                  fontSize: { xs: "0.7rem", sm: "0.875rem" },
                  minWidth: { xs: 28, sm: 36 },
                  height: { xs: 28, sm: 36 },
                },
                "& .MuiPagination-ul": {
                  justifyContent: { xs: "center", sm: "flex-end" },
                },
                width: { xs: "100%", sm: "auto" },
                display: { xs: "flex", sm: "block" },
                justifyContent: { xs: "center", sm: "flex-end" },
                "& .MuiPaginationItem-firstLast": {
                  display: { xs: "none", sm: "inline-flex" },
                },
              }}
            />
          </Box>
        </>
      )}
    </Paper>
  );
}

