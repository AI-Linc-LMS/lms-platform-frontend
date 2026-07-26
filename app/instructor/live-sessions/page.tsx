"use client";

import { useEffect, useState } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { instructorService, type InstructorLiveSession } from "@/lib/services/instructor.service";

function fmt(dt: string): string {
  try {
    return new Date(dt).toLocaleString(undefined, {
      weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
  } catch {
    return dt;
  }
}

export default function InstructorLiveSessionsPage() {
  const [upcoming, setUpcoming] = useState<InstructorLiveSession[]>([]);
  const [past, setPast] = useState<InstructorLiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await instructorService.getLiveSessions();
        if (!cancelled) {
          setUpcoming(data.upcoming);
          setPast(data.past);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Couldn't load your live sessions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Teach"
        title="Live sessions"
        description="Sessions scheduled for the courses and batches you're assigned to."
        accent="pink"
        icon="mdi:video-outline"
      />

      {error && <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>{error}</Typography>}
      {!error && !loading && upcoming.length === 0 && past.length === 0 && (
        <Box sx={{ p: 4, textAlign: "center", borderRadius: 3, border: "1px dashed var(--border-default)" }}>
          <Typography sx={{ color: "text.secondary" }}>No live sessions scheduled for your courses or batches.</Typography>
        </Box>
      )}

      <SessionGroup title="Upcoming" icon="mdi:calendar-clock" sessions={upcoming} highlight />
      <SessionGroup title="Past" icon="mdi:history" sessions={past} />
    </PageShell>
  );
}

function SessionGroup({
  title,
  icon,
  sessions,
  highlight,
}: {
  title: string;
  icon: string;
  sessions: InstructorLiveSession[];
  highlight?: boolean;
}) {
  if (sessions.length === 0) return null;
  return (
    <Box sx={{ mt: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <Icon icon={icon} width={20} style={{ color: highlight ? "#ec4899" : "#6b7280" }} />
        <Typography sx={{ fontWeight: 800, fontSize: "1.05rem" }}>{title}</Typography>
      </Stack>
      <Stack spacing={1}>
        {sessions.map((s) => (
          <Box key={s.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.75, borderRadius: 2,
            bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)",
            opacity: highlight ? 1 : 0.85 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, flexShrink: 0, display: "grid", placeItems: "center",
              color: "#fff", background: highlight ? "linear-gradient(135deg,#ec4899,#a855f7)" : "linear-gradient(135deg,#94a3b8,#64748b)" }}>
              <Icon icon="mdi:video" width={20} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.94rem" }} noWrap>{s.topic_name}</Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.82rem" }}>
                {fmt(s.class_datetime)} · {s.duration_minutes} min
              </Typography>
            </Box>
            {highlight && s.join_link && (
              <Button variant="contained" size="small" disableElevation href={s.join_link} target="_blank" rel="noopener"
                startIcon={<Icon icon="mdi:login-variant" width={16} />}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700,
                  background: "linear-gradient(135deg,#ec4899,#a855f7)" }}>
                Join
              </Button>
            )}
            {!highlight && <Chip size="small" label="ended" sx={{ fontWeight: 700 }} />}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
