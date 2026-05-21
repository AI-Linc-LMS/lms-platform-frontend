"use client";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Chip,
  Typography,
  Box,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { StudentLiveSession } from "@/lib/services/live-sessions";

interface LiveSessionsTableProps {
  sessions: StudentLiveSession[];
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCopyPassword: (password: string) => void;
  onWatchRecording: (activity: StudentLiveSession) => void;
  watchingRecordingId: number | null;
  formatDateTime: (dateString: string) => string;
  formatSessionDuration: (minutes: number | undefined) => string;
  formatSessionStatusCaption: (activity: StudentLiveSession) => string | null;
}

export function LiveSessionsTable({
  sessions,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onCopyPassword,
  onWatchRecording,
  watchingRecordingId,
  formatDateTime,
  formatSessionDuration,
  formatSessionStatusCaption,
}: LiveSessionsTableProps) {
  const { t } = useTranslation("common");
  const paginatedSessions = sessions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const statusChip = (activity: StudentLiveSession) => {
    if (activity.meeting_status === "scheduled") {
      return (
        <Chip
          label={t("liveSessions.scheduled")}
          size="small"
          sx={{
            backgroundColor:
              "color-mix(in srgb, var(--accent-indigo) 16%, transparent)",
            color: "var(--accent-indigo)",
            fontWeight: 600,
            fontSize: "0.75rem",
          }}
        />
      );
    }
    if (activity.meeting_status === "live") {
      return (
        <Chip
          label={t("liveSessions.live")}
          size="small"
          sx={{
            backgroundColor:
              "color-mix(in srgb, var(--success-500) 16%, transparent)",
            color: "var(--success-500)",
            fontWeight: 600,
            fontSize: "0.75rem",
          }}
        />
      );
    }
    if (activity.meeting_status === "ended") {
      return (
        <Chip
          label={t("liveSessions.classEnded")}
          size="small"
          sx={{
            backgroundColor:
              "color-mix(in srgb, var(--font-tertiary) 45%, transparent)",
            color: "var(--font-primary)",
            fontWeight: 600,
            fontSize: "0.75rem",
          }}
        />
      );
    }
    if (activity.meeting_status === "expired") {
      return (
        <Chip
          label={t("liveSessions.expired")}
          size="small"
          sx={{
            backgroundColor:
              "color-mix(in srgb, var(--warning-500) 18%, transparent)",
            color: "var(--warning-500)",
            fontWeight: 600,
            fontSize: "0.75rem",
          }}
        />
      );
    }
    if ((activity.time_remaining_minutes ?? 0) <= 0) {
      return (
        <Chip
          label={t("liveSessions.expired")}
          size="small"
          sx={{
            backgroundColor: "var(--error-500)",
            color: "var(--font-light)",
            fontWeight: 600,
            fontSize: "0.75rem",
          }}
        />
      );
    }
    return (
      <Chip
        label={t("liveSessions.scheduled")}
        size="small"
        sx={{
          backgroundColor: "var(--surface)",
          color: "var(--font-secondary)",
          fontWeight: 600,
          fontSize: "0.75rem",
        }}
      />
    );
  };

  return (
    <Paper
      sx={{
        borderRadius: 2,
        border: "1px solid var(--border-default)",
        overflow: "hidden",
          backgroundColor: "var(--card-bg)",
      }}
    >
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "var(--surface)" }}>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "var(--font-primary)",
                  fontSize: "0.875rem",
                }}
              >
                {t("liveSessions.name")}
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "var(--font-primary)",
                  fontSize: "0.875rem",
                  minWidth: 160,
                }}
              >
                {t("liveSessions.startsAt")}
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "var(--font-primary)",
                  fontSize: "0.875rem",
                  width: 100,
                }}
              >
                {t("liveSessions.duration")}
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "var(--font-primary)",
                  fontSize: "0.875rem",
                  minWidth: 140,
                }}
              >
                {t("liveSessions.statusColumn")}
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "var(--font-primary)",
                  fontSize: "0.875rem",
                }}
                align="right"
              >
                {t("liveSessions.action")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedSessions.map((activity) => {
              const startRaw =
                activity.class_datetime ?? activity.expires_at ?? "";
              const statusCaption = formatSessionStatusCaption(activity);
              return (
                <TableRow
                  key={activity.id}
                  sx={{ "&:hover": { backgroundColor: "var(--surface)" } }}
                >
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "var(--font-primary)" }}
                    >
                      {activity.topic_name ?? activity.name ?? "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: "var(--font-primary)" }}>
                      {startRaw ? formatDateTime(startRaw) : "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                      {formatSessionDuration(activity.duration_minutes)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 0.75,
                      }}
                    >
                      {statusChip(activity)}
                      {statusCaption ? (
                        <Typography
                          variant="caption"
                          sx={{ color: "var(--font-secondary)", lineHeight: 1.4 }}
                        >
                          {statusCaption}
                        </Typography>
                      ) : null}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 1,
                      }}
                    >
                      {(() => {
                        const joinUrl = (
                          activity.zoom_join_url ||
                          activity.join_link ||
                          ""
                        ).trim();
                        const isScheduledOrLive =
                          activity.meeting_status === "scheduled" ||
                          activity.meeting_status === "live";
                        const showGoogleMeetJoin =
                          activity.is_google_meet &&
                          Boolean(joinUrl) &&
                          isScheduledOrLive;
                        const showZoomJoin =
                          !activity.is_google_meet &&
                          activity.meeting_status === "live" &&
                          Boolean(joinUrl);
                        if (!showGoogleMeetJoin && !showZoomJoin) return null;
                        return (
                          <>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => window.open(joinUrl, "_blank")}
                              startIcon={
                                <IconWrapper icon="mdi:video" size={18} />
                              }
                              sx={{
                                backgroundColor: activity.is_google_meet
                                  ? "var(--success-500)"
                                  : "var(--accent-indigo)",
                                color: "var(--font-light)",
                                textTransform: "none",
                                fontWeight: 600,
                                fontSize: "0.875rem",
                                px: 2,
                                "&:hover": {
                                  backgroundColor: activity.is_google_meet
                                    ? "color-mix(in srgb, var(--success-500) 84%, var(--accent-indigo-dark))"
                                    : "var(--accent-indigo-dark)",
                                },
                              }}
                            >
                              {activity.is_google_meet
                                ? t("liveSessions.joinGoogleMeet")
                                : t("liveSessions.joinLiveClass")}
                            </Button>
                            {activity.zoom_password && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "var(--font-secondary)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}
                              >
                                {t("liveSessions.password")}:{" "}
                                {activity.zoom_password}
                                <Button
                                  size="small"
                                  sx={{
                                    minWidth: 0,
                                    p: 0.25,
                                    fontSize: "0.7rem",
                                    textTransform: "none",
                                  }}
                                  onClick={() =>
                                    onCopyPassword(activity.zoom_password!)
                                  }
                                >
                                  {t("liveSessions.copy")}
                                </Button>
                              </Typography>
                            )}
                          </>
                        );
                      })()}
                      {(activity.meeting_status === "ended" ||
                        activity.meeting_status === "expired") &&
                        (activity.zoom_recording_url?.trim() ? (
                          <Button
                            variant="text"
                            size="small"
                            disabled={watchingRecordingId === activity.id}
                            startIcon={
                              watchingRecordingId === activity.id ? (
                                <CircularProgress size={14} color="inherit" />
                              ) : (
                                <IconWrapper
                                  icon="mdi:play-circle-outline"
                                  size={16}
                                />
                              )
                            }
                            onClick={() => onWatchRecording(activity)}
                            sx={{
                              fontSize: "0.75rem",
                              textTransform: "none",
                              color: "var(--font-primary)",
                              "& .MuiButton-startIcon": {
                                color: "inherit",
                              },
                              "&:hover": {
                                backgroundColor:
                                  "color-mix(in srgb, var(--font-primary) 8%, transparent)",
                              },
                            }}
                          >
                            {t("liveSessions.watchRecording")}
                          </Button>
                        ) : (
                          <Tooltip
                            title={t("liveSessions.recordingNotAvailable")}
                            placement="top"
                          >
                            <span>
                              <Button
                                variant="text"
                                size="small"
                                disabled
                                startIcon={
                                  <IconWrapper
                                    icon="mdi:play-circle-outline"
                                    size={16}
                                  />
                                }
                                sx={{
                                  fontSize: "0.75rem",
                                  textTransform: "none",
                                  color: "var(--font-secondary)",
                                  "& .MuiButton-startIcon": {
                                    color: "inherit",
                                  },
                                  "&.Mui-disabled": {
                                    color: "var(--font-secondary)",
                                    WebkitTextFillColor: "var(--font-secondary)",
                                    opacity: 0.85,
                                  },
                                }}
                              >
                                {t("liveSessions.watchRecording")}
                              </Button>
                            </span>
                          </Tooltip>
                        ))}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={sessions.length}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 25, 50]}
        sx={{
          borderTop: "1px solid var(--border-default)",
          "& .MuiTablePagination-toolbar": { px: 2 },
          "& .MuiTablePagination-selectLabel": {
            fontSize: "0.875rem",
            color: "var(--font-secondary)",
          },
          "& .MuiTablePagination-displayedRows": {
            fontSize: "0.875rem",
            color: "var(--font-secondary)",
          },
          "& .MuiTablePagination-select": { fontSize: "0.875rem" },
        }}
      />
    </Paper>
  );
}
