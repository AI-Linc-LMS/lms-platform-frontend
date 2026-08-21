"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  ButtonBase,
  Collapse,
  Typography,
  Button,
  TextField,
  CircularProgress,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  adminLiveActivitiesService,
  LiveSessionTranscriptResponse,
  LiveClassOccurrence,
} from "@/lib/services/admin/admin-live-activities.service";
import { SummaryMarkdown } from "@/components/live-sessions/ui/SummaryMarkdown";
import { formatSessionTime } from "@/lib/utils/session-time";

interface LiveSessionTranscriptSectionProps {
  liveClassId: number;
  /** Whether a summary already exists (from the list/detail payload) - gates showing the section. */
  hasSummary?: boolean;
  /** Recurring series: its dated occurrences. Transcripts/summaries live on the occurrence rows,
   *  so when present the section renders one lazy per-date row instead of the single series view. */
  occurrences?: LiveClassOccurrence[] | null;
  timezone?: string | null;
  /** Series title fallback for dates without a per-date title. */
  seriesTitle?: string | null;
}

/** The loaded summary + searchable transcript (shared by the single view and each per-date row). */
function TranscriptContent({ data }: { data: LiveSessionTranscriptResponse }) {
  const { t } = useTranslation("common");
  const [query, setQuery] = useState("");

  const hasTranscript = Boolean(data.transcript_text?.trim());
  const summary = data.summary?.trim() || "";

  if (!hasTranscript && !summary) {
    return (
      <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
        {t("adminLiveSessions.transcriptUnavailable", "Transcript not available for this session yet.")}
      </Typography>
    );
  }

  const filteredLines = (() => {
    const text = data.transcript_text ?? "";
    if (!text) return [] as string[];
    const lines = text.split("\n");
    if (!query.trim()) return lines;
    const q = query.trim().toLowerCase();
    return lines.filter((l) => l.toLowerCase().includes(q));
  })();

  return (
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
          <SummaryMarkdown text={summary} fontSize="0.8rem" />
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
  );
}

/** One date of a recurring series. Loads its transcript on first open, not on render - a series
 *  can hold dozens of dates, and fetching every transcript up front would cost dozens of requests
 *  for rows most admins never expand. Once opened it stays loaded. */
function OccurrenceTranscriptRow({
  liveClassId,
  occurrence,
  timezone,
  seriesTitle,
}: {
  liveClassId: number;
  occurrence: LiveClassOccurrence;
  timezone?: string | null;
  seriesTitle?: string | null;
}) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<LiveSessionTranscriptResponse | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(async () => {
    const next = !open;
    setOpen(next);
    if (next && !loaded && !loading) {
      setLoading(true);
      try {
        setData(await adminLiveActivitiesService.getTranscript(liveClassId, occurrence.id));
      } catch {
        setData(null);
      } finally {
        setLoaded(true);
        setLoading(false);
      }
    }
  }, [open, loaded, loading, liveClassId, occurrence.id]);

  return (
    <Box sx={{ border: "1px solid var(--border-default)", borderRadius: 2, overflow: "hidden" }}>
      <ButtonBase
        onClick={toggle}
        sx={{ width: "100%", display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1.1, textAlign: "start" }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--font-primary)" }}>
            {formatSessionTime(occurrence.occurrence_datetime, timezone)}
          </Typography>
          <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {occurrence.topic_name?.trim() || seriesTitle || ""}
          </Typography>
        </Box>
        {loading ? (
          <CircularProgress size={16} />
        ) : (
          <IconWrapper icon={open ? "mdi:chevron-up" : "mdi:chevron-down"} size={18} color="var(--font-secondary)" />
        )}
      </ButtonBase>
      <Collapse in={open} unmountOnExit>
        <Box sx={{ px: 1.5, pb: 1.5 }}>
          {!loaded ? null : data ? (
            <TranscriptContent data={data} />
          ) : (
            <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
              {t("adminLiveSessions.transcriptLoadFailed", "Couldn't load this date's transcript.")}
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

/** AI summary + searchable transcript for a recorded Zoom session. Transcript is lazy-loaded.
 *  For a recurring series (occurrences given) each date gets its own lazy row instead. */
export function LiveSessionTranscriptSection({ liveClassId, hasSummary, occurrences, timezone, seriesTitle }: LiveSessionTranscriptSectionProps) {
  const { t } = useTranslation("common");
  const [data, setData] = useState<LiveSessionTranscriptResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

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

  const perDate = [...(occurrences ?? [])].sort((a, b) =>
    (a.occurrence_datetime || "").localeCompare(b.occurrence_datetime || "")
  );

  if (perDate.length > 0) {
    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "var(--font-primary)", mb: 0.5 }}>
          {t("adminLiveSessions.transcriptTitle", "Transcript & AI summary")}
        </Typography>
        <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mb: 1.5 }}>
          {t("adminLiveSessions.transcriptPerDateHint", "Each date of this series keeps its own transcript and summary - expand a date to read it.")}
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {perDate.map((o) => (
            <OccurrenceTranscriptRow
              key={o.id}
              liveClassId={liveClassId}
              occurrence={o}
              timezone={timezone}
              seriesTitle={seriesTitle}
            />
          ))}
        </Box>
      </Box>
    );
  }

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

      {loaded && data && <TranscriptContent data={data} />}
    </Box>
  );
}
