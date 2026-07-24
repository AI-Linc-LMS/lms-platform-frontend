"use client";

import { Box, ButtonBase, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { AdaptiveCourseListItem } from "@/lib/services/adaptive-course.service";

/** A single adaptive-course card. Shared by the standalone library page and the
 *  "Adaptive courses" section embedded under /courses. */
export function AdaptiveCourseCard({
  course,
  onOpen,
  onHover,
}: {
  course: AdaptiveCourseListItem;
  onOpen: () => void;
  onHover?: () => void;  // warm the destination route on hover/focus for instant open
}) {
  return (
    <ButtonBase
      onClick={onOpen}
      onMouseEnter={onHover}
      onFocus={onHover}
      sx={{
        width: "100%",
        height: "100%",
        textAlign: "left",
        // Flex column so every card lines up: image on top, meta pinned to the
        // bottom - regardless of whether a course has a description or more
        // metric rows. Fixes the ragged, inconsistent card layout.
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        borderRadius: 3,
        p: 2.5,
        bgcolor: "var(--card-bg, #fff)",
        border: "1px solid var(--border-default, #ececf1)",
        boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 10px 26px -22px rgba(16,24,40,0.18)",
        transition: "transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease",
        "&:hover": {
          transform: "translateY(-3px)",
          borderColor: "color-mix(in srgb, #6366f1 40%, transparent)",
          boxShadow: "0 20px 40px -26px rgba(99, 102, 241, 0.45)",
        },
      }}
    >
      {/* Always render the image band (fallback gradient) so the header lines up. */}
      <Box sx={{ width: "100%", aspectRatio: "16 / 9", borderRadius: 2.5, overflow: "hidden", mb: 1.5, flexShrink: 0, background: "linear-gradient(135deg, color-mix(in srgb, #6366f1 14%, transparent), color-mix(in srgb, #a855f7 12%, transparent))" }}>
        {course.card_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.card_image_url} alt={course.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        )}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.5 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: 3, flexShrink: 0, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 60%, #ec4899 100%)", boxShadow: "0 14px 26px -14px rgba(168, 85, 247, 0.6)" }}>
          <Icon icon="mdi:book-education-outline" width={22} />
        </Box>
        <Box component="span" sx={{ px: 1, py: 0.3, borderRadius: 999, fontSize: "0.65rem", fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase", color: "#a855f7", bgcolor: "color-mix(in srgb, #a855f7 14%, transparent)" }}>
          Adaptive
        </Box>
      </Box>

      <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{course.title}</Typography>
      <Typography sx={{ color: "text.secondary", mt: 0.75, fontSize: "0.86rem", lineHeight: 1.5, minHeight: "2.6em", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {course.description || ""}
      </Typography>

      {/* Meta pinned to the card bottom so it aligns across every card. */}
      <Box sx={{ display: "flex", gap: 1.5, columnGap: 2, mt: "auto", pt: 2, flexWrap: "wrap" }}>
        <Metric icon="mdi:view-module-outline" label="modules" value={course.module_count} />
        <Metric icon="mdi:file-tree-outline" label="submodules" value={course.submodule_count} />
        <Metric icon="mdi:book-open-variant" label="articles" value={course.article_count} />
        <Metric icon="mdi:tune-vertical" label="quizzes" value={course.quiz_count} />
        {(course.coding_count ?? 0) > 0 && <Metric icon="mdi:robot-happy-outline" label="coding" value={course.coding_count ?? 0} />}
        {(course.video_count ?? 0) > 0 && <Metric icon="mdi:play-circle-outline" label="videos" value={course.video_count ?? 0} />}
      </Box>
    </ButtonBase>
  );
}

function Metric({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.6 }}>
      <Icon icon={icon} width={16} style={{ color: "#6366f1" }} />
      <Typography component="span" sx={{ fontWeight: 800, fontSize: "0.85rem" }}>{value}</Typography>
      <Typography component="span" sx={{ color: "text.secondary", fontSize: "0.78rem" }}>{label}</Typography>
    </Box>
  );
}
