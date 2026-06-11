"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  TextField,
  CircularProgress,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { studentLiveSessionsService } from "@/lib/services/live-sessions";
import type { StudentLiveSessionTranscript } from "@/lib/services/live-sessions/types";

interface StudentSessionSummaryDialogProps {
  activityId: number;
  topicName: string;
}

/** Button + dialog showing the AI summary and searchable transcript for an ended session. Self-contained:
 *  lazily fetches the transcript only when opened, so it adds no cost to the sessions list. */
export function StudentSessionSummaryDialog({ activityId, topicName }: StudentSessionSummaryDialogProps) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<StudentLiveSessionTranscript | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const handleOpen = async () => {
    setOpen(true);
    if (data) return;
    try {
      setLoading(true);
      const res = await studentLiveSessionsService.getTranscript(activityId);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const lines = (() => {
    const text = data?.transcript_text ?? "";
    if (!text) return [] as string[];
    const all = text.split("\n");
    if (!query.trim()) return all;
    const q = query.trim().toLowerCase();
    return all.filter((l) => l.toLowerCase().includes(q));
  })();

  return (
    <>
      <Button
        variant="text"
        size="small"
        onClick={handleOpen}
        startIcon={<IconWrapper icon="mdi:text-box-outline" size={16} />}
        sx={{
          fontSize: "0.75rem",
          textTransform: "none",
          color: "var(--font-primary)",
          "& .MuiButton-startIcon": { color: "inherit" },
        }}
      >
        {t("liveSessions.summaryAndTranscript", "Summary & transcript")}
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {topicName || t("liveSessions.summaryAndTranscript", "Summary & transcript")}
        </DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : !data ? (
            <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
              {t("liveSessions.transcriptUnavailable", "Summary and transcript are not available for this session yet.")}
            </Typography>
          ) : (
            <>
              {data.summary?.trim() ? (
                <Box
                  sx={{
                    p: 1.5,
                    mb: 2,
                    borderRadius: 1,
                    bgcolor: "color-mix(in srgb, var(--accent-indigo) 8%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--accent-indigo) 24%, transparent)",
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "var(--accent-indigo)", display: "block", mb: 0.5 }}>
                    {t("liveSessions.aiSummary", "AI summary")}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", color: "var(--font-primary)" }}>
                    {data.summary}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mb: 1.5 }}>
                  {t("liveSessions.summaryPending", "AI summary not generated yet.")}
                </Typography>
              )}

              {data.transcript_text?.trim() ? (
                <>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder={t("liveSessions.transcriptSearch", "Search transcript…")}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    sx={{ mb: 1 }}
                    InputProps={{ startAdornment: <IconWrapper icon="mdi:magnify" size={18} /> }}
                  />
                  <Box
                    sx={{
                      maxHeight: 300,
                      overflowY: "auto",
                      p: 1.5,
                      borderRadius: 1,
                      border: "1px solid var(--border-default)",
                      bgcolor: "var(--surface)",
                      fontSize: "0.8rem",
                      lineHeight: 1.5,
                    }}
                  >
                    {lines.length === 0 ? (
                      <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                        {t("liveSessions.transcriptNoMatch", "No lines match your search.")}
                      </Typography>
                    ) : (
                      lines.map((line, idx) => <div key={idx} style={{ marginBottom: 2 }}>{line}</div>)
                    )}
                  </Box>
                </>
              ) : (
                <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                  {t("liveSessions.transcriptUnavailableShort", "Transcript not available yet.")}
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t("liveSessions.close", "Close")}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
