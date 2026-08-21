"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { nextSitting, studentLiveSessionsService, type NextSitting, type StudentLiveSession } from "@/lib/services/live-sessions";
import { ModuleEmpty, ModuleHeader, ModulePanel, ModuleRowsSkeleton, Pill, fmtDateTime, timeUntil } from "./shared";

const GRADIENT = "linear-gradient(135deg, #06b6d4, #3b82f6)";

function joinUrl(s: StudentLiveSession): string | null {
  return (s.is_google_meet ? s.join_link : s.zoom_join_url) ?? null;
}

/** One row of the card: the session plus the sitting it is actually about. */
interface SessionRow {
  session: StudentLiveSession;
  next: NextSitting;
}

/**
 * Live sittings first, then soonest.
 *
 * Everything here is ranked and labelled by the resolved NEXT SITTING, never by the series'
 * `class_datetime` - that field is frozen at occurrence #1, so ordering by it ordered series by
 * when they STARTED and pushed the genuinely imminent session to the bottom (and, past three rows,
 * off the card). A session with no sitting left to come, or one cancelled by notice, drops out:
 * this is a "what's next" rail, and the live-sessions page carries the cancellation banner and its
 * reason.
 */
function selectSessions(list: StudentLiveSession[], now: number): SessionRow[] {
  const rows: SessionRow[] = [];
  for (const s of list) {
    if (s.meeting_status !== "live" && s.meeting_status !== "scheduled") continue;
    const next = nextSitting(s, now);
    if (next) rows.push({ session: s, next });
  }
  return rows
    .sort((a, b) => {
      const rank = (r: SessionRow) => (r.next.live ? 0 : 1);
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      return a.next.startMs - b.next.startMs;
    })
    .slice(0, 3);
}

export function LiveSessionsPanel() {
  const router = useRouter();
  const [sessions, setSessions] = useState<StudentLiveSession[] | null>(null);
  const [hidden, setHidden] = useState(false);
  // The labels are relative, so they go stale where nothing re-renders: the card used to fetch
  // once on mount and freeze, never counting down or flipping to LIVE.
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    studentLiveSessionsService
      .getSessions()
      .then((list) => { if (!cancelled) setSessions(list ?? []); })
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
          {items.map(({ session: s, next: n }) => {
            // LIVE comes from the resolved sitting, not the series status: those disagreed, so a
            // row could be styled LIVE while its own label read "in 3d".
            const live = n.live;
            const url = joinUrl(s);
            const t = timeUntil(n.startIso, n.durationMin);
            return (
              <ButtonBase
                key={`${s.id}:${n.id ?? 0}`}
                onClick={() => router.push("/live-sessions")}
                sx={{ width: "100%", justifyContent: "flex-start", textAlign: "left", p: 1, borderRadius: 2.5, border: "1px solid", borderColor: live ? "#a5f3fc" : "#eef2f7", bgcolor: live ? "#ecfeff" : "transparent", "&:hover": { bgcolor: live ? "#cffafe" : "#f0f9ff" } }}
              >
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ width: "100%", minWidth: 0 }}>
                  <Box sx={{ width: 38, height: 38, borderRadius: 2, flexShrink: 0, display: "grid", placeItems: "center", color: "#0891b2", bgcolor: "#cffafe" }}>
                    <Icon icon={s.is_google_meet ? "mdi:google" : "mdi:video"} width={19} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: 700, fontSize: "0.86rem", color: "#0f172a" }}>{s.topic_name || s.name || "Live session"}</Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.4 }}>
                      {live ? (
                        <Pill icon="mdi:circle" color="#dc2626" bg="#fef2f2">LIVE NOW</Pill>
                      ) : (
                        <Pill icon="mdi:calendar-clock" color="#0e7490" bg="#ecfeff">{t?.text ?? fmtDateTime(n.startIso)}</Pill>
                      )}
                      {s.course_detail?.title && (
                        <Typography noWrap sx={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 600, maxWidth: 120 }}>{s.course_detail.title}</Typography>
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
                      sx={{ flexShrink: 0, px: 1.5, py: 0.6, borderRadius: 999, fontSize: "0.72rem", fontWeight: 800, color: "#fff", background: "linear-gradient(135deg, #06b6d4, #2563eb)", cursor: "pointer", "&:hover": { filter: "brightness(1.05)" } }}
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
