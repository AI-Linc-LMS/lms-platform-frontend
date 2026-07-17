"use client";

import { useState } from "react";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import {
  adminAdaptiveCourseService,
  type AdminAdaptiveCourseVideoLesson,
} from "@/lib/services/admin/admin-adaptive-course.service";
import { VideoLessonPlayer } from "@/components/adaptive-quiz/presentation/VideoLessonPlayer";

const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: "Queued", color: "#f59e0b", icon: "mdi:clock-outline" },
  rendering: { label: "Rendering…", color: "#0891b2", icon: "mdi:loading" },
  ready: { label: "Ready", color: "#10b981", icon: "mdi:check-circle" },
  failed: { label: "Failed", color: "#ef4444", icon: "mdi:alert-circle" },
};

/** Admin row for a rendered video lesson: status badge, inline preview when ready,
 *  re-render action, and the render error when failed. */
export function AdminVideoLessonViewer({
  courseId,
  lesson,
  onChanged,
}: {
  courseId: number;
  lesson: AdminAdaptiveCourseVideoLesson;
  onChanged?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const s = STATUS_META[lesson.render_status] ?? STATUS_META.pending;
  const rendering = lesson.render_status === "rendering";

  async function reRender() {
    if (busy) return;
    setBusy(true);
    try {
      await adminAdaptiveCourseService.rerenderVideoLesson(courseId, lesson.video_lesson_id);
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ borderRadius: 2.5, border: "1px solid color-mix(in srgb, var(--border-default) 65%, transparent)", overflow: "hidden" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", p: 1.25 }}>
        <Icon icon="mdi:movie-open-play" width={15} style={{ color: "#0891b2" }} />
        <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }}>{lesson.title}</Typography>
        <Stack
          direction="row"
          spacing={0.4}
          alignItems="center"
          sx={{ px: 0.75, py: 0.2, borderRadius: 999, bgcolor: `color-mix(in srgb, ${s.color} 12%, transparent)` }}
        >
          <Icon icon={s.icon} width={12} color={s.color} className={rendering ? "spin" : ""} />
          <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: s.color }}>{s.label}</Typography>
        </Stack>
        {lesson.duration_seconds > 0 && (
          <Typography sx={{ fontSize: "0.74rem", color: "text.secondary" }}>
            ~{Math.max(1, Math.round(lesson.duration_seconds / 60))} min
          </Typography>
        )}
        <Box sx={{ flex: 1 }} />
        {lesson.render_status === "ready" && (
          <ButtonBase onClick={() => setOpen((o) => !o)} sx={{ gap: 0.4, color: "#0891b2", fontSize: "0.75rem", fontWeight: 800 }}>
            <Icon icon={open ? "mdi:chevron-up" : "mdi:play-circle-outline"} width={14} />
            {open ? "Hide" : "Preview"}
          </ButtonBase>
        )}
        <ButtonBase
          onClick={reRender}
          disabled={busy || rendering}
          sx={{ gap: 0.4, color: "#64748b", fontSize: "0.75rem", fontWeight: 800, opacity: busy || rendering ? 0.5 : 1 }}
        >
          <Icon icon="mdi:refresh" width={14} className={busy ? "spin" : ""} />
          Re-render
        </ButtonBase>
      </Box>
      {lesson.render_status === "failed" && lesson.render_error && (
        <Typography sx={{ px: 1.25, pb: 1, fontSize: "0.74rem", color: "#ef4444" }}>{lesson.render_error}</Typography>
      )}
      {open && lesson.render_status === "ready" && (
        <Box sx={{ px: 1.25, pb: 1.5 }}>
          <VideoLessonPlayer
            lesson={{
              video_lesson_id: lesson.video_lesson_id,
              title: lesson.title,
              duration_seconds: lesson.duration_seconds,
              storage: lesson.storage ?? "s3",
              video_url: lesson.video_url,
              poster_url: lesson.poster_url,
              captions_url: lesson.captions_url,
              vimeo_id: lesson.vimeo_id,
            }}
          />
        </Box>
      )}
    </Box>
  );
}
