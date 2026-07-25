"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  adminLiveActivitiesService,
  LiveSessionTranscriptResponse,
} from "@/lib/services/admin/admin-live-activities.service";

interface LiveSessionTranscriptSectionProps {
  liveClassId: number;
  /** Whether a summary already exists (from the list/detail payload) - gates showing the section. */
  hasSummary?: boolean;
}

/** AI summary + searchable transcript for a recorded Zoom session. Transcript is lazy-loaded. */
export function LiveSessionTranscriptSection({ liveClassId, hasSummary }: LiveSessionTranscriptSectionProps) {
  const { t } = useTranslation("common");
  const [data, setData] = useState<LiveSessionTranscriptResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    if (loaded) return;
    try {
      setLoading(true);
      const res = await adminLiveActivitiesService.getTranscript(liveClassId);
      setData(res);
      setLoaded(true);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [liveClassId, loaded]);

  const hasTranscript = Boolean(data?.transcript_text?.trim());
  const summary = data?.summary?.trim() || "";

  const filteredLines = (() => {
    const text = data?.transcript_text ?? "";
    if (!text) return [] as string[];
    const lines = text.split("\n");
    if (!query.trim()) return lines;
    const q = query.trim().toLowerCase();
    return lines.filter((l) => l.toLowerCase().includes(q));
  })();

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
          {t("adminLiveSessions.transcriptTitle", "Transcript & AI summary")}
        </Typography>
        {!loaded && (
          <Button
            variant="outlined"
            size="small"
            disabled={loading}
            onClick={load}
            startIcon={
              loading ? <CircularProgress size={14} color="inherit" /> : <IconWrapper icon="mdi:text-box-search-outline" size={16} />
            }
            sx={{ textTransform: "none", fontSize: "0.75rem" }}
          >
            {t("adminLiveSessions.transcriptView", "View transcript")}
          </Button>
        )}
      </Box>

      {!loaded && !loading && (
        <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block" }}>
          {hasSummary
            ? t("adminLiveSessions.transcriptReady", "A transcript and AI summary are available for this session.")
            : t("adminLiveSessions.transcriptPending", "The transcript and summary appear here once the recording is processed.")}
        </Typography>
      )}

      {loaded && (
        <>
          {summary ? (
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
                {t("adminLiveSessions.aiSummary", "AI summary")}
              </Typography>
              <Typography
                variant="body2"
                component="div"
                sx={{ color: "var(--font-primary)", whiteSpace: "pre-wrap", fontSize: "0.8rem" }}
              >
                {summary}
              </Typography>
            </Box>
          ) : (
            <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mb: 1.5 }}>
              {t("adminLiveSessions.summaryPending", "AI summary not generated yet.")}
            </Typography>
          )}

          {hasTranscript ? (
            <>
              <TextField
                size="small"
                fullWidth
                placeholder={t("adminLiveSessions.transcriptSearch", "Search transcript…")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                sx={{ mb: 1 }}
                InputProps={{
                  startAdornment: <IconWrapper icon="mdi:magnify" size={18} />,
                }}
              />
              <Box
                sx={{
                  maxHeight: 280,
                  overflowY: "auto",
                  p: 1.5,
                  borderRadius: 1,
                  border: "1px solid var(--border-default)",
                  bgcolor: "var(--surface)",
                  fontSize: "0.78rem",
                  lineHeight: 1.5,
                  color: "var(--font-primary)",
                }}
              >
                {filteredLines.length === 0 ? (
                  <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                    {t("adminLiveSessions.transcriptNoMatch", "No lines match your search.")}
                  </Typography>
                ) : (
                  filteredLines.map((line, idx) => (
                    <div key={idx} style={{ marginBottom: 2 }}>{line}</div>
                  ))
                )}
              </Box>
            </>
          ) : (
            <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
              {t("adminLiveSessions.transcriptUnavailable", "Transcript not available for this session yet.")}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}
