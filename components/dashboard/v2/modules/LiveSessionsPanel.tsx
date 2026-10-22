"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { studentLiveSessionsService, type UpcomingSession } from "@/lib/services/live-sessions";
import { ModuleEmpty, ModuleHeader, ModulePanel, ModuleRowsSkeleton, Pill, fmtDateTime, timeUntil } from "./shared";
import { phoneText } from "@/components/common/mobile/phoneText";

const GRADIENT = "linear-gradient(135deg, #06b6d4, #3b82f6)";

/** Rows on the card. It asks for a couple more than it shows, so a sitting that ends between the
 *  fetch and the render does not leave a gap in the rail. */
const ROWS = 3;
export const FETCH_LIMIT = 5;
const DEFAULT_DURATION_MIN = 60;

/** One row of the card: the sitting, and whether it is running at the card's current tick. */
interface SessionRow {
  session: UpcomingSession;
  live: boolean;
  startMs: number;
}

/**
 * Live sittings first, then soonest.
 *
 * `upcoming/` has already resolved every series the learner may see to its NEXT sitting and
 * ordered the page by that start, so the card no longer walks each occurrence of each series
 * itself. What is left to decide here is time-dependent and so belongs to the minute tick: a
 * sitting that has ended since the fetch drops out, and one whose start has passed is LIVE. The
 * server's own `started` flag is honoured too, so a host who opens the room early is joinable
 * before the clock says so.
 */
export function selectSessions(list: UpcomingSession[], now: number): SessionRow[] {
  const rows: SessionRow[] = [];
  for (const s of list) {
    if (s.notice_type === "cancelled") continue;
    const startMs = new Date(s.starts_at).getTime();
    if (Number.isNaN(startMs)) continue;
    const endMs = startMs + (s.duration_minutes || DEFAULT_DURATION_MIN) * 60_000;
    if (now > endMs) continue;
    rows.push({ session: s, startMs, live: startMs <= now || (s.started && !s.ended) });
  }
  return rows
    .sort((a, b) => {
      if (a.live !== b.live) return a.live ? -1 : 1;
      return a.startMs - b.startMs;
    })
    .slice(0, ROWS);
}

export function LiveSessionsPanel() {
  const router = useRouter();
  const [sessions, setSessions] = useState<UpcomingSession[] | null>(null);
  const [hidden, setHidden] = useState(false);
  // The labels are relative, so they go stale where nothing re-renders: the card used to fetch
  // once on mount and freeze, never counting down or flipping to LIVE.
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    // The lean endpoint: the next sitting per series, one small page, nothing about the archive.
    // The rich list this card used to load carried every occurrence of every series the learner
    // could see, on every visit to the dashboard, to show three rows.
    studentLiveSessionsService
      .getUpcoming({ limit: FETCH_LIMIT })
      .then((page) => { if (!cancelled) setSessions(page.sessions ?? []); })
      .catch(() => { if (!cancelled) setHidden(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const h = setInterval(() => setTick(Date.now()), 60_000);
    return () => clearInterval(h);
  }, []);

  const items = useMemo(
    () => (sessions ? selectSessions(sessions, tick) : null),
    [sessions, tick],
  );

  if (hidden) return null;

  return (
    <ModulePanel>
      <ModuleHeader icon="mdi:video-outline" title="Live sessions" gradient={GRADIENT} onViewAll={() => router.push("/live-sessions")} />
      {items == null ? (
        <ModuleRowsSkeleton rows={2} />
      ) : items.length === 0 ? (
        <ModuleEmpty icon="mdi:calendar-blank-outline" message="No live sessions scheduled right now." />
      ) : (
        <Stack spacing={1}>
          {items.map(({ session: s, live }) => {
            // The server already chose between the Meet link and the Zoom link for this sitting.
            const url = s.join_url;
            const t = timeUntil(s.starts_at, s.duration_minutes);
            return (
              <ButtonBase
                key={`${s.session_id}:${s.occurrence_id}`}
                onClick={() => router.push("/live-sessions")}
                sx={{ width: "100%", justifyContent: "flex-start", textAlign: "left", p: 1, borderRadius: 2.5, border: "1px solid", borderColor: live ? "#a5f3fc" : "#eef2f7", bgcolor: live ? "#ecfeff" : "transparent", "&:hover": { bgcolor: live ? "#cffafe" : "#f0f9ff" } }}
              >
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ width: "100%", minWidth: 0 }}>
                  <Box sx={{ width: 38, height: 38, borderRadius: 2, flexShrink: 0, display: "grid", placeItems: "center", color: "#0891b2", bgcolor: "#cffafe" }}>
                    <Icon icon={s.is_google_meet ? "mdi:google" : "mdi:video"} width={19} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: 700, fontSize: "0.86rem", color: "#0f172a" }}>{s.title || "Live session"}</Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.4 }}>
                      {live ? (
                        <Pill icon="mdi:circle" color="#dc2626" bg="#fef2f2">LIVE NOW</Pill>
                      ) : (
                        <Pill icon="mdi:calendar-clock" color="#0e7490" bg="#ecfeff">{t?.text ?? fmtDateTime(s.starts_at)}</Pill>
                      )}
                      {s.course && (
                        <Typography noWrap sx={{ fontSize: phoneText(0.68), color: "#94a3b8", fontWeight: 600, maxWidth: 120 }}>{s.course}</Typography>
                      )}
                    </Stack>
                  </Box>
                  {live && url ? (
                    <Box
                      component="span"
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); window.open(url, "_blank", "noopener,noreferrer"); }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); window.open(url, "_blank", "noopener,noreferrer"); } }}
                      sx={{ flexShrink: 0, px: 1.5, py: 0.6, borderRadius: 999, fontSize: phoneText(0.72), fontWeight: 800, color: "#fff", background: "linear-gradient(135deg, #06b6d4, #2563eb)", cursor: "pointer", "&:hover": { filter: "brightness(1.05)" } }}
                    >
                      Join
                    </Box>
                  ) : (
                    <Icon icon="mdi:chevron-right" width={18} color="#cbd5e1" />
                  )}
                </Stack>
              </ButtonBase>
            );
          })}
        </Stack>
      )}
    </ModulePanel>
  );
}
