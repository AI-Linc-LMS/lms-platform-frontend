"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { assessmentService, type Assessment } from "@/lib/services/assessment.service";
import { ModuleEmpty, ModuleHeader, ModulePanel, ModuleRowsSkeleton, Pill, fmtDateTime, timeUntil } from "./shared";

const GRADIENT = "linear-gradient(135deg, #6366f1, #8b5cf6)";

function isSubmitted(a: Assessment): boolean {
  return a.status === "submitted" || a.status === "completed" || a.status === "finalized";
}
function isExpired(a: Assessment): boolean {
  if (a.status === "expired") return true;
  if (a.end_time && new Date(a.end_time).getTime() < Date.now() && !isSubmitted(a)) return true;
  return false;
}
function startsInFuture(a: Assessment): boolean {
  return Boolean(a.start_time && new Date(a.start_time).getTime() > Date.now());
}

/** Available (current) first, sorted by soonest due; then scheduled, by start. */
function selectUpcoming(list: Assessment[]): Assessment[] {
  const actionable = list.filter((a) => !isSubmitted(a) && !isExpired(a));
  const available = actionable
    .filter((a) => !startsInFuture(a))
    .sort((a, b) => (a.end_time ? new Date(a.end_time).getTime() : Infinity) - (b.end_time ? new Date(b.end_time).getTime() : Infinity));
  const scheduled = actionable
    .filter(startsInFuture)
    .sort((a, b) => new Date(a.start_time!).getTime() - new Date(b.start_time!).getTime());
  return [...available, ...scheduled].slice(0, 3);
}

function TimingChip({ a }: { a: Assessment }) {
  if (a.status === "in_progress") {
    return <Pill icon="mdi:progress-clock" color="#b45309" bg="#fffbeb">In progress</Pill>;
  }
  if (startsInFuture(a)) {
    const t = timeUntil(a.start_time);
    return <Pill icon="mdi:calendar-clock" color="#4338ca" bg="#eef2ff">Starts {t?.text ?? fmtDateTime(a.start_time)}</Pill>;
  }
  const due = timeUntil(a.end_time);
  if (due) {
    return <Pill icon="mdi:timer-sand" color={due.soon ? "#b91c1c" : "#475569"} bg={due.soon ? "#fef2f2" : "#f1f5f9"}>Due {due.text}</Pill>;
  }
  return <Pill icon="mdi:play-circle-outline" color="#15803d" bg="#f0fdf4">Available now</Pill>;
}

export function UpcomingAssessmentsPanel() {
  const router = useRouter();
  const [items, setItems] = useState<Assessment[] | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    assessmentService
      .getActiveAssessments()
      .then((list) => { if (!cancelled) setItems(selectUpcoming(list ?? [])); })
      .catch(() => { if (!cancelled) setHidden(true); });
    return () => { cancelled = true; };
  }, []);

  if (hidden) return null;

  return (
    <ModulePanel>
      <ModuleHeader icon="mdi:clipboard-text-clock-outline" title="Assessments" gradient={GRADIENT} onViewAll={() => router.push("/assessments")} />
      {items == null ? (
        <ModuleRowsSkeleton rows={2} />
      ) : items.length === 0 ? (
        <ModuleEmpty icon="mdi:check-circle-outline" message="You're all caught up - no assessments waiting." />
      ) : (
        <Stack spacing={1}>
          {items.map((a) => (
            <ButtonBase
              key={a.id}
              onClick={() => router.push(`/assessments/${a.slug}`)}
              sx={{ width: "100%", justifyContent: "flex-start", textAlign: "left", p: 1, borderRadius: 2.5, border: "1px solid #eef2f7", "&:hover": { bgcolor: "#faf9ff", borderColor: "#e9d5ff" } }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ width: "100%", minWidth: 0 }}>
                <Box sx={{ width: 38, height: 38, borderRadius: 2, flexShrink: 0, display: "grid", placeItems: "center", color: "#6366f1", bgcolor: "#eef2ff" }}>
                  <Icon icon="mdi:file-document-check-outline" width={19} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography noWrap sx={{ fontWeight: 700, fontSize: "0.86rem", color: "#0f172a" }}>{a.title}</Typography>
                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.4 }}>
                    <TimingChip a={a} />
                    <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 600 }}>
                      {a.duration_minutes}m · {a.number_of_questions} Q
                    </Typography>
                  </Stack>
                </Box>
                <Icon icon="mdi:chevron-right" width={18} color="#cbd5e1" />
              </Stack>
            </ButtonBase>
          ))}
        </Stack>
      )}
    </ModulePanel>
  );
}
