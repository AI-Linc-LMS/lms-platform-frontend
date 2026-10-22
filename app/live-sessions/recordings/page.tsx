"use client";

/**
 * Recordings — the archive, on its own route and paginated.
 *
 * It used to be a tab on the live-sessions page, which meant every student who opened that page
 * to check when their next class was also downloaded the tenant's entire recorded history, and
 * then downloaded it again every 60 seconds while a class was near. On 2026-10-22 that reached
 * 125 seconds for one tenant and the load balancer answered 504 at its 60s idle timeout.
 *
 * Two things make this page cheap, and both matter:
 *
 *  - it reads `recordings/`, which carries playback FLAGS and no prep state, no reminder state,
 *    no join links and no Zoom URLs. Playback still goes through the signed stream endpoint, one
 *    request at the moment a student presses Watch.
 *  - it pages. The archive only grows, so a page that loads all of it gets slower every week it
 *    exists. Twenty rows at a time stays twenty rows at a time forever.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { RecordingPlayerDialog } from "@/components/live-sessions/RecordingPlayerDialog";
import { StudentSessionSummaryDialog } from "@/components/live-sessions/StudentSessionSummaryDialog";
import { studentLiveSessionsService } from "@/lib/services/live-sessions";
import type { RecordingSession } from "@/lib/services/live-sessions";

const PAGE_SIZE = 20;

function heldOn(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

export default function RecordingsPage() {
  const [rows, setRows] = useState<RecordingSession[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState<RecordingSession | null>(null);
  const [reading, setReading] = useState<RecordingSession | null>(null);

  const loadPage = useCallback(async (offset: number) => {
    const first = offset === 0;
    if (first) setLoading(true);
    else setLoadingMore(true);
    try {
      const page = await studentLiveSessionsService.getRecordings({
        limit: PAGE_SIZE,
        offset,
      });
      // Append rather than replace, so "Load more" builds the list instead of paging past it.
      setRows((prev) => (first ? page.sessions : [...prev, ...page.sessions]));
      setTotal(page.count);
      setHasMore(page.has_more);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadPage(0);
  }, [loadPage]);

  return (
    <PageShell maxWidth={980}>
      <ModulePageHeader
        eyebrow="LIVE"
        title="Recordings"
        description="Every class that left something behind — a recording, a transcript or AI notes. This is also where to find a class held before you joined your batch."
        accent="indigo"
        icon="mdi:play-circle-outline"
        action={
          <Button
            component={Link}
            href="/live-sessions"
            startIcon={<Icon icon="mdi:calendar-blank-outline" width={18} />}
            sx={{ textTransform: "none", fontWeight: 700, minHeight: 44 }}
          >
            All sessions
          </Button>
        }
      />

      <Box sx={{ mt: 2.5 }}>
        {loading && (
          <Stack alignItems="center" sx={{ py: 6 }}>
            <CircularProgress size={28} />
          </Stack>
        )}

        {!loading && failed && rows.length === 0 && (
          <Box
            sx={{
              borderRadius: 3,
              border: "1px solid var(--border-default)",
              bgcolor: "var(--card-bg)",
              p: 3,
              textAlign: "center",
            }}
          >
            <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Could not load recordings</Typography>
            <Button
              onClick={() => void loadPage(0)}
              variant="contained"
              sx={{ textTransform: "none", fontWeight: 700, minHeight: 44, mt: 1.5 }}
            >
              Try again
            </Button>
          </Box>
        )}

        {!loading && !failed && rows.length === 0 && (
          <Box
            sx={{
              borderRadius: 3,
              border: "1px solid var(--border-default)",
              bgcolor: "var(--card-bg)",
              p: { xs: 3, sm: 4 },
              textAlign: "center",
            }}
          >
            <Icon icon="mdi:play-circle-outline" width={36} style={{ opacity: 0.5 }} />
            <Typography sx={{ fontWeight: 800, mt: 1.5, mb: 0.5 }}>No recordings yet</Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
              Once a class has been held and its recording is ready, it will appear here.
            </Typography>
          </Box>
        )}

        {rows.length > 0 && (
          <>
            <Typography
              data-testid="recordings-count"
              sx={{
                color: "text.secondary",
                fontSize: "0.82rem",
                fontWeight: 700,
                mb: 1.5,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
              }}
            >
              Showing {rows.length} of {total}
            </Typography>

            <Stack spacing={1.5}>
              {rows.map((s) => (
                <Box
                  key={s.occurrence_id}
                  data-testid="recording-row"
                  sx={{
                    borderRadius: 3,
                    border: "1px solid var(--border-default)",
                    bgcolor: "var(--card-bg)",
                    p: { xs: 1.75, sm: 2 },
                    display: "flex",
                    gap: { xs: 1, sm: 1.75 },
                    alignItems: { xs: "flex-start", sm: "center" },
                    flexWrap: "wrap",
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0, width: { xs: "100%", sm: "auto" } }}>
                    <Typography sx={{ fontWeight: 800, fontSize: "1rem", minWidth: 0 }}>
                      {s.title}
                    </Typography>
                    <Typography sx={{ color: "text.secondary", fontSize: "0.85rem", mt: 0.25 }}>
                      {[heldOn(s.held_at), s.course, s.batch].filter(Boolean).join(" · ")}
                    </Typography>
                    {!s.attended && (
                      // Said plainly on the archive, where catching up is the point. History
                      // deliberately does not stamp anyone "Missed"; here it is just a reason to
                      // press Watch.
                      <Typography
                        data-testid="did-not-attend"
                        sx={{ color: "text.secondary", fontSize: "0.78rem", mt: 0.25 }}
                      >
                        You were not marked present for this one
                      </Typography>
                    )}
                  </Box>

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      width: { xs: "100%", sm: "auto" },
                      mt: { xs: 1.5, sm: 0 },
                      flexShrink: 0,
                      "& > *": { flex: { xs: 1, sm: "0 0 auto" }, minHeight: { xs: 44, sm: "auto" } },
                    }}
                  >
                    {(s.has_transcript || s.has_summary) && (
                      <Button
                        onClick={() => setReading(s)}
                        startIcon={<Icon icon="mdi:text-box-outline" width={16} />}
                        sx={{
                          textTransform: "none",
                          fontWeight: 700,
                          color: "#6366f1",
                          px: 1.5,
                          borderRadius: 2,
                          border: "1px solid var(--border-default)",
                        }}
                      >
                        Notes
                      </Button>
                    )}
                    {s.has_recording && (
                      <Button
                        onClick={() => setPlaying(s)}
                        variant="contained"
                        startIcon={<Icon icon="mdi:play" width={16} />}
                        sx={{ textTransform: "none", fontWeight: 800, px: 2 }}
                      >
                        Watch
                      </Button>
                    )}
                  </Stack>
                </Box>
              ))}
            </Stack>

            {hasMore && (
              <Stack alignItems="center" sx={{ mt: 2.5 }}>
                <Button
                  data-testid="load-more-recordings"
                  onClick={() => void loadPage(rows.length)}
                  disabled={loadingMore}
                  startIcon={
                    loadingMore ? (
                      <CircularProgress size={16} />
                    ) : (
                      <Icon icon="mdi:chevron-down" width={18} />
                    )
                  }
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    minHeight: 44,
                    px: 3,
                    borderRadius: 2,
                    border: "1px solid var(--border-default)",
                  }}
                >
                  {loadingMore ? "Loading" : `Load ${Math.min(PAGE_SIZE, total - rows.length)} more`}
                </Button>
              </Stack>
            )}

            {failed && rows.length > 0 && (
              <Typography
                sx={{ color: "text.secondary", fontSize: "0.85rem", textAlign: "center", mt: 2 }}
              >
                Could not load more just now.
              </Typography>
            )}
          </>
        )}
      </Box>

      {/* Playback and notes both resolve per OCCURRENCE. Asking by session id alone returns the
          series-latest file, which is how every date of a recurring series once played the same
          video - and it belonged to none of them. */}
      {playing && (
        <RecordingPlayerDialog
          liveClassId={playing.session_id}
          occurrenceId={playing.occurrence_id}
          title={playing.title}
          open
          onClose={() => setPlaying(null)}
        />
      )}
      {reading && (
        <StudentSessionSummaryDialog
          activityId={reading.session_id}
          occurrenceId={reading.occurrence_id}
          topicName={reading.title}
          open
          onClose={() => setReading(null)}
        />
      )}
    </PageShell>
  );
}
