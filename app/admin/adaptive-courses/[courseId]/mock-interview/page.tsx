"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, Box, Button, ButtonBase, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import type {
  CalibrationInterviewStatus,
  CourseInterviewAttempt,
  CourseInterviewTemplate,
  CourseInterviewsResponse,
} from "@/lib/types/adaptive-journey";

const STATUS_CHIP: Record<string, { color: string; bg: string }> = {
  completed: { color: "#15803d", bg: "#dcfce7" },
  in_progress: { color: "#4338ca", bg: "#e0e7ff" },
  scheduled: { color: "#b45309", bg: "#fef3c7" },
  cancelled: { color: "#64748b", bg: "#f1f5f9" },
  failed: { color: "#b91c1c", bg: "#fee2e2" },
};

export default function AdminMockInterviewPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const courseId = Number(useParams().courseId);
  const [data, setData] = useState<CourseInterviewsResponse | null>(null);
  const [calib, setCalib] = useState<CalibrationInterviewStatus | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(courseId)) return;
    let cancelled = false;
    (async () => {
      const [d, c] = await Promise.allSettled([
        adaptiveJourneyService.getCourseInterviews(courseId),
        adaptiveJourneyService.getCalibrationInterview(courseId),
      ]);
      if (cancelled) return;
      if (d.status === "fulfilled") setData(d.value);
      if (c.status === "fulfilled") setCalib(c.value);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await adaptiveJourneyService.createCalibrationInterview(courseId);
      setCalib(res);
      const refreshed = await adaptiveJourneyService.getCourseInterviews(courseId);
      setData(refreshed);
      showToast("Calibration interview created.", "success");
    } catch {
      showToast("Couldn't create the calibration interview.", "error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>
        <ButtonBase
          onClick={() => router.push(`/admin/adaptive-courses/${courseId}`)}
          sx={{ mb: 2, color: "#6366f1", fontWeight: 700, gap: 0.5, fontSize: "0.9rem" }}
        >
          <Icon icon="mdi:arrow-left" width={18} /> Back to course
        </ButtonBase>

        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2.5 }}>
          <Box sx={{ width: 42, height: 42, borderRadius: 2.5, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)" }}>
            <Icon icon="mdi:account-voice" width={22} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: "1.3rem" }}>Mock interviews</Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
              This course&apos;s interview rounds, every student attempt, and its AI feedback.
            </Typography>
          </Box>
        </Stack>

        {!loading && (
          <Box sx={{ p: 2, mb: 2.5, borderRadius: 3, bgcolor: "var(--card-bg, #fff)", border: "1px solid var(--border-default, #ececf1)" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography sx={{ fontWeight: 800 }}>Calibration interview</Typography>
                  <Chip
                    label={calib?.exists ? "Ready" : "Not set up"}
                    size="small"
                    sx={{ height: 20, fontWeight: 800, fontSize: "0.66rem", color: calib?.exists ? "#15803d" : "#64748b", bgcolor: calib?.exists ? "#dcfce7" : "#f1f5f9" }}
                  />
                </Stack>
                <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mt: 0.25 }}>
                  {calib?.exists
                    ? `Live entry level-gauge (~${calib.duration_minutes ?? 10} min) — seeds each student's AI Student Model. New courses get this automatically.`
                    : "AI conversational level-gauge that seeds the Student Model. New courses get this automatically; create it here for older courses."}
                </Typography>
              </Box>
              {!calib?.exists && (
                <Button
                  variant="contained"
                  disabled={generating}
                  onClick={generate}
                  startIcon={generating ? <CircularProgress size={16} sx={{ color: "white" }} /> : <Icon icon="mdi:auto-fix" width={18} />}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}
                >
                  {generating ? "Creating…" : "Generate calibration interview (AI)"}
                </Button>
              )}
            </Stack>
          </Box>
        )}

        {loading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
            <CircularProgress sx={{ color: "#6366f1" }} />
          </Box>
        ) : (
          <>
            <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", mb: 1.25 }}>Interview rounds</Typography>
            {!data || data.templates.length === 0 ? (
              <Box sx={{ p: 3, mb: 3, textAlign: "center", borderRadius: 3, border: "1px dashed var(--border-default, #ececf1)" }}>
                <Typography sx={{ color: "text.secondary" }}>
                  No interview rounds in this course yet — add an interview node to the journey.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.25, mb: 3 }}>
                {data.templates.map((t) => (
                  <TemplateCard key={t.id} t={t} />
                ))}
              </Box>
            )}

            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.05rem" }}>Student attempts &amp; feedback</Typography>
              {data && <Chip label={`${data.attempt_count} attempts`} size="small" sx={{ fontWeight: 700 }} />}
            </Stack>
            {!data || data.attempts.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center", borderRadius: 3, border: "1px dashed var(--border-default, #ececf1)" }}>
                <Icon icon="mdi:inbox-outline" width={36} style={{ opacity: 0.4 }} />
                <Typography sx={{ color: "text.secondary", mt: 1 }}>No interview attempts yet.</Typography>
              </Box>
            ) : (
              <Stack spacing={1.25}>
                {data.attempts.map((a) => (
                  <AttemptRow key={a.interview_id} a={a} />
                ))}
              </Stack>
            )}
          </>
        )}
      </Box>
    </MainLayout>
  );
}

function TemplateCard({ t }: { t: CourseInterviewTemplate }) {
  return (
    <Box sx={{ p: 2, borderRadius: 3, bgcolor: "var(--card-bg, #fff)", border: "1px solid var(--border-default, #ececf1)" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>{t.title}</Typography>
        {t.is_level_gauge && <Chip label="Level gauge" size="small" sx={{ height: 20, fontSize: "0.62rem", fontWeight: 800, color: "#6d28d9", bgcolor: "#ede9fe" }} />}
      </Stack>
      <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mt: 0.25 }}>{t.topic}{t.subtopic ? ` · ${t.subtopic}` : ""}</Typography>
      <Stack direction="row" spacing={0.75} sx={{ mt: 1, gap: 0.75 }} flexWrap="wrap">
        <Chip size="small" variant="outlined" label={t.difficulty} />
        <Chip size="small" variant="outlined" label={`${t.duration_minutes} min`} />
        <Chip size="small" variant="outlined" label={`Release: ${t.result_release_mode}`} />
      </Stack>
    </Box>
  );
}

function AttemptRow({ a }: { a: CourseInterviewAttempt }) {
  const sc = STATUS_CHIP[a.status] ?? STATUS_CHIP.scheduled;
  return (
    <Box sx={{ p: 2, borderRadius: 3, bgcolor: "var(--card-bg, #fff)", border: "1px solid var(--border-default, #ececf1)" }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }} justifyContent="space-between">
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Avatar src={a.profile_pic_url || undefined} sx={{ width: 38, height: 38 }}>{a.name?.[0]}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.92rem" }}>{a.name}</Typography>
            <Typography sx={{ fontSize: "0.76rem", color: "text.secondary" }}>
              {a.template_title || a.topic}
              {a.submitted_at ? ` · ${new Date(a.submitted_at).toLocaleDateString()}` : ""}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ gap: 1 }}>
          {a.overall_percentage != null && (
            <Chip label={`${Math.round(a.overall_percentage)}%`} size="small" sx={{ fontWeight: 800, color: "#0f172a", bgcolor: "#f1f5f9" }} />
          )}
          <Chip label={a.status.replace("_", " ")} size="small" sx={{ fontWeight: 700, color: sc.color, bgcolor: sc.bg, textTransform: "capitalize" }} />
          <Chip
            size="small"
            variant="outlined"
            icon={<Icon icon={a.result_visible_to_student ? "mdi:eye-outline" : "mdi:eye-off-outline"} width={14} />}
            label={a.result_visible_to_student ? "Result shown" : "Result hidden"}
          />
        </Stack>
      </Stack>
    </Box>
  );
}
