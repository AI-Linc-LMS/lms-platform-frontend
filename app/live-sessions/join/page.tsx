"use client";

/**
 * "Join now" — the one page that has to work when nothing else does.
 *
 * On 2026-10-22 the live-sessions page's own 60s poll, armed at T-15:00 on every open tab at
 * once, drove RDS read IOPS from 0.4 to 1,183 and single requests to 125 seconds. The load
 * balancer answered 504 at its 60s idle timeout. The students worst affected were the ones with
 * the simplest need: they were trying to get into a class that was about to start.
 *
 * So this page exists, and it is deliberately austere. It reads ONE endpoint - `join-now/` - that
 * does a single indexed range scan, returns at most ten rows and a few hundred bytes, and joins
 * nothing over the tenant's history. It loads no calendar, no filters, no attendance, no
 * materials, no recordings. It is safe to poll hard, and it keeps answering while the rich page
 * is struggling, which is the entire point of it being a separate page rather than a tab.
 *
 * Deliberately NOT here: anything that would grow the payload or the query. Every field on these
 * cards is one the student needs in the sixty seconds before a class starts. A convenience added
 * here lands on a request that fires every fifteen seconds from every open tab.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { studentLiveSessionsService } from "@/lib/services/live-sessions";
import type { JoinNowSession } from "@/lib/services/live-sessions";

/** How often to ask. Cheap enough to be frequent, and the whole reason this endpoint is tiny. */
const POLL_MS = 15_000;
/** Spread across clients so every open tab does not ask on the same second. */
const JITTER_MS = 5_000;

const jitteredPollMs = () => POLL_MS + Math.floor(Math.random() * JITTER_MS);

function countdown(seconds: number): string {
  if (seconds <= 0) return "in progress";
  if (seconds < 60) return "starting now";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `in ${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `in ${hrs}h ${mins % 60}m`;
}

function timeOfDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function JoinNowPage() {
  const [sessions, setSessions] = useState<JoinNowSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  /** Server clock at the last load, so the countdown does not drift with a wrong device clock. */
  const [serverNow, setServerNow] = useState<number | null>(null);
  const [loadedAt, setLoadedAt] = useState<number>(() => Date.now());
  const inFlight = useRef(false);

  const load = useCallback(async (opts?: { background?: boolean }) => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const data = await studentLiveSessionsService.getJoinNow();
      setSessions(data.sessions);
      const parsed = Date.parse(data.now);
      setServerNow(Number.isNaN(parsed) ? null : parsed);
      setLoadedAt(Date.now());
      setFailed(false);
    } catch {
      // A failed background poll keeps whatever is on screen. A student mid-join must not have
      // their link replaced by an error because one request lost a race.
      if (!opts?.background) setFailed(true);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => void load({ background: true }), jitteredPollMs());
    return () => clearInterval(id);
  }, [load]);

  // A tab that sat hidden comes back to a current answer rather than a stale countdown.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void load({ background: true });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  // One ticking clock for the whole page, so each card is not its own timer.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1_000);
    return () => clearInterval(id);
  }, []);

  const rows = useMemo(() => {
    // Age the server's own clock rather than trusting the device's: a phone an hour off would
    // otherwise show "in progress" for a class that has not started, or hide one that has.
    const elapsed = Date.now() - loadedAt;
    void tick; // the countdown recomputes on every tick
    return sessions.map((s) => ({
      ...s,
      secondsAway:
        serverNow == null
          ? s.starts_in_seconds
          : s.starts_in_seconds - Math.floor(elapsed / 1000),
    }));
  }, [sessions, serverNow, loadedAt, tick]);

  return (
    <PageShell maxWidth={820}>
      <ModulePageHeader
        eyebrow="LIVE"
        title="Join now"
        description="Classes starting in the next 15 minutes, and any that are already running. This page stays light on purpose, so it keeps working when everyone arrives at once."
        accent="indigo"
        icon="mdi:video-outline"
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

        {!loading && failed && (
          <Box
            sx={{
              borderRadius: 3,
              border: "1px solid var(--border-default)",
              bgcolor: "var(--card-bg)",
              p: 3,
              textAlign: "center",
            }}
          >
            <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Could not check just now</Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.9rem", mb: 2 }}>
              Your class may still be running. Try again, or open the full sessions page.
            </Typography>
            <Button
              onClick={() => void load()}
              variant="contained"
              sx={{ textTransform: "none", fontWeight: 700, minHeight: 44 }}
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
            <Icon icon="mdi:calendar-check-outline" width={36} style={{ opacity: 0.5 }} />
            <Typography sx={{ fontWeight: 800, mt: 1.5, mb: 0.5 }}>
              Nothing starting right now
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.9rem", mb: 2.5 }}>
              A class shows up here 15 minutes before it begins. Leave this page open and it will
              appear on its own.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="center">
              <Button
                component={Link}
                href="/live-sessions"
                variant="contained"
                sx={{ textTransform: "none", fontWeight: 700, minHeight: 44 }}
              >
                See what is coming up
              </Button>
              <Button
                component={Link}
                href="/live-sessions/recordings"
                sx={{ textTransform: "none", fontWeight: 700, minHeight: 44 }}
              >
                Catch up on recordings
              </Button>
            </Stack>
          </Box>
        )}

        <Stack spacing={1.5}>
          {rows.map((s) => {
            const live = s.started || s.secondsAway <= 0;
            return (
              <Box
                key={s.occurrence_id}
                data-testid="join-now-card"
                sx={{
                  borderRadius: 3,
                  border: live ? "1px solid #6366f1" : "1px solid var(--border-default)",
                  bgcolor: "var(--card-bg)",
                  p: { xs: 2, sm: 2.5 },
                  display: "flex",
                  gap: 2,
                  alignItems: { xs: "flex-start", sm: "center" },
                  flexWrap: "wrap",
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0, width: { xs: "100%", sm: "auto" } }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    {live && (
                      <Box
                        data-testid="live-pill"
                        sx={{
                          px: 1,
                          py: 0.25,
                          borderRadius: 999,
                          bgcolor: "#6366f1",
                          color: "#fff",
                          fontSize: "0.68rem",
                          fontWeight: 800,
                          letterSpacing: "0.06em",
                          '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
                        }}
                      >
                        LIVE
                      </Box>
                    )}
                    <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", minWidth: 0 }}>
                      {s.title}
                    </Typography>
                  </Stack>
                  <Typography sx={{ color: "text.secondary", fontSize: "0.88rem" }}>
                    {[s.course, timeOfDay(s.starts_at), countdown(s.secondsAway)]
                      .filter(Boolean)
                      .join(" · ")}
                  </Typography>
                </Box>

                <Box sx={{ width: { xs: "100%", sm: "auto" }, flexShrink: 0 }}>
                  {s.join_url ? (
                    <Button
                      component="a"
                      href={s.join_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="contained"
                      startIcon={<Icon icon="mdi:video" width={18} />}
                      sx={{
                        textTransform: "none",
                        fontWeight: 800,
                        minHeight: 44,
                        width: { xs: "100%", sm: "auto" },
                        px: 2.5,
                      }}
                    >
                      Join
                    </Button>
                  ) : (
                    // Never a button that goes nowhere: a null link means the host has not opened
                    // the room yet, and saying so is more use than a dead control.
                    <Typography
                      data-testid="room-not-open"
                      sx={{ color: "text.secondary", fontSize: "0.85rem", fontWeight: 700 }}
                    >
                      Waiting for the host
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Box>
    </PageShell>
  );
}
