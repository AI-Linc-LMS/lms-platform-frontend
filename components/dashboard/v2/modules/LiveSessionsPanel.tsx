"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { studentLiveSessionsService, type StudentLiveSession } from "@/lib/services/live-sessions";
import { ModuleEmpty, ModuleHeader, ModulePanel, ModuleRowsSkeleton, Pill, fmtDateTime, timeUntil } from "./shared";

const GRADIENT = "linear-gradient(135deg, #06b6d4, #3b82f6)";

function joinUrl(s: StudentLiveSession): string | null {
  return (s.is_google_meet ? s.join_link : s.zoom_join_url) ?? null;
}

/** Live sessions first, then soonest scheduled. */
function selectSessions(list: StudentLiveSession[]): StudentLiveSession[] {
  const relevant = list.filter((s) => s.meeting_status === "live" || s.meeting_status === "scheduled");
  return relevant
    .sort((a, b) => {
      const rank = (s: StudentLiveSession) => (s.meeting_status === "live" ? 0 : 1);
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      const at = a.class_datetime ? new Date(a.class_datetime).getTime() : Infinity;
      const bt = b.class_datetime ? new Date(b.class_datetime).getTime() : Infinity;
      return at - bt;
    })
    .slice(0, 3);
}

export function LiveSessionsPanel() {
  const router = useRouter();
  const [items, setItems] = useState<StudentLiveSession[] | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    studentLiveSessionsService
      .getSessions()
      .then((list) => { if (!cancelled) setItems(selectSessions(list ?? [])); })
      .catch(() => { if (!cancelled) setHidden(true); });
    return () => { cancelled = true; };
  }, []);

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
          {items.map((s) => {
            const live = s.meeting_status === "live";
            const url = joinUrl(s);
            const t = timeUntil(s.class_datetime);
            return (
              <ButtonBase
                key={s.id}
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
                        <Pill icon="mdi:calendar-clock" color="#0e7490" bg="#ecfeff">{t?.text ?? fmtDateTime(s.class_datetime)}</Pill>
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
