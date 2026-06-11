"use client";

import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import type {
  JourneyTimelineEntry,
  JourneyCourseWeeks,
  JourneyWeek,
} from "@/lib/services/admin/admin-student.service";
import { ADAPTIVE, EmptyState, formatDateTime } from "./shared";

const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  content: { icon: "mdi:book-check", color: ADAPTIVE.indigo, label: "Course content" },
  assessment: { icon: "mdi:clipboard-text", color: ADAPTIVE.green, label: "Assessment" },
  mock_interview: { icon: "mdi:account-voice", color: ADAPTIVE.amber, label: "Mock interview" },
  adaptive_quiz: { icon: "mdi:lightbulb-on", color: ADAPTIVE.indigo, label: "Adaptive quiz" },
  adaptive_coding: { icon: "mdi:code-braces", color: ADAPTIVE.pink, label: "Adaptive coding" },
  adaptive_video: { icon: "mdi:play-circle", color: ADAPTIVE.purple, label: "Video companion" },
};

// Course-content category → icon/color/labels for the weekly view.
const CATEGORY_META: Record<
  string,
  { icon: string; color: string; one: string; many: string }
> = {
  article: { icon: "mdi:file-document-outline", color: ADAPTIVE.indigo, one: "article", many: "articles" },
  video: { icon: "mdi:play-circle-outline", color: ADAPTIVE.purple, one: "video", many: "videos" },
  quiz: { icon: "mdi:help-circle-outline", color: ADAPTIVE.green, one: "quiz", many: "quizzes" },
  coding: { icon: "mdi:code-braces", color: ADAPTIVE.pink, one: "coding problem", many: "coding problems" },
  other: { icon: "mdi:dots-horizontal-circle-outline", color: "#94a3b8", one: "other", many: "others" },
};
const CATEGORY_ORDER = ["article", "video", "quiz", "coding", "other"];

function catMeta(type: string) {
  return CATEGORY_META[type] || CATEGORY_META.other;
}

function ViewToggle({
  view,
  onChange,
}: {
  view: "weekly" | "feed";
  onChange: (v: "weekly" | "feed") => void;
}) {
  const opts: Array<{ key: "weekly" | "feed"; label: string; icon: string }> = [
    { key: "weekly", label: "Weekly progress", icon: "mdi:calendar-week" },
    { key: "feed", label: "Activity feed", icon: "mdi:timeline-clock-outline" },
  ];
  return (
    <Box
      sx={{
        display: "inline-flex",
        p: 0.5,
        mb: 3,
        borderRadius: 999,
        border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
        backgroundColor: "color-mix(in srgb, var(--surface) 60%, transparent)",
        gap: 0.5,
      }}
    >
      {opts.map((o) => {
        const active = view === o.key;
        return (
          <Box
            key={o.key}
            component="button"
            onClick={() => onChange(o.key)}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              px: 2,
              py: 0.85,
              borderRadius: 999,
              cursor: "pointer",
              border: "none",
              fontSize: "0.82rem",
              fontWeight: 700,
              color: active ? "#fff" : "var(--font-secondary)",
              background: active ? ADAPTIVE.gradient : "transparent",
              transition: "all 0.15s ease",
            }}
          >
            <IconWrapper icon={o.icon} size={16} />
            {o.label}
          </Box>
        );
      })}
    </Box>
  );
}

function WeekCard({ week }: { week: JourneyWeek }) {
  const summary = CATEGORY_ORDER.filter((c) => (week.type_counts[c] ?? 0) > 0).map((c) => {
    const n = week.type_counts[c];
    const m = catMeta(c);
    return { key: c, color: m.color, icon: m.icon, text: `${n} ${n === 1 ? m.one : m.many}` };
  });

  return (
    <Box
      sx={{
        borderRadius: 3,
        border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
        backgroundColor: "var(--card-bg)",
        overflow: "hidden",
      }}
    >
      {/* Week header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: { xs: 2, md: 2.5 },
          py: 1.5,
          borderBottom: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
          flexWrap: "wrap",
        }}
      >
        <Box
          sx={{
            px: 1,
            py: 0.4,
            borderRadius: 1.5,
            fontWeight: 800,
            fontSize: "0.72rem",
            color: "#fff",
            background: ADAPTIVE.gradient,
            flexShrink: 0,
          }}
        >
          WEEK {week.weekno}
        </Box>
        <Typography
          sx={{
            fontWeight: 700,
            color: "var(--font-primary)",
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {week.module_title}
        </Typography>
        {/* Per-type summary chips */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {summary.map((s) => (
            <Box
              key={s.key}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                px: 1,
                py: 0.3,
                borderRadius: 999,
                fontSize: "0.7rem",
                fontWeight: 700,
                color: s.color,
                bgcolor: `color-mix(in srgb, ${s.color} 14%, transparent)`,
              }}
            >
              <IconWrapper icon={s.icon} size={13} />
              {s.text}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Completed items */}
      <Box sx={{ p: { xs: 1.5, md: 2 }, display: "flex", flexDirection: "column", gap: 1 }}>
        {week.items.map((it) => {
          const m = catMeta(it.type);
          return (
            <Box
              key={it.id}
              sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}
            >
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  bgcolor: `color-mix(in srgb, ${m.color} 14%, transparent)`,
                }}
              >
                <IconWrapper icon={m.icon} size={16} color={m.color} />
              </Box>
              <Typography
                sx={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: "0.86rem",
                  color: "var(--font-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {it.title || "Untitled content"}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "var(--font-tertiary)", flexShrink: 0 }}
              >
                {formatDateTime(it.completed_at)}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function WeeklyView({ weeklyProgress }: { weeklyProgress: JourneyCourseWeeks[] }) {
  const courses = (weeklyProgress || []).filter((c) => c.weeks.length > 0);
  if (courses.length === 0) {
    return (
      <EmptyState
        icon="mdi:calendar-blank-outline"
        title="No course content completed yet"
        hint="As the student completes articles, videos, quizzes and coding problems, they'll appear here grouped by course week."
      />
    );
  }
  const multiCourse = courses.length > 1;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {courses.map((course) => (
        <Box key={course.course_id} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {multiCourse && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconWrapper icon="mdi:book-open-variant" size={18} color={ADAPTIVE.indigo} />
              <Typography sx={{ fontWeight: 800, color: "var(--font-primary)" }}>
                {course.course_title}
              </Typography>
            </Box>
          )}
          {course.weeks.map((w) => (
            <WeekCard key={`${course.course_id}-${w.weekno}`} week={w} />
          ))}
        </Box>
      ))}
    </Box>
  );
}

function ActivityFeed({ timeline }: { timeline: JourneyTimelineEntry[] }) {
  if (!timeline || timeline.length === 0) {
    return (
      <EmptyState
        icon="mdi:timeline-clock-outline"
        title="No activity timeline"
        hint="Once the student engages with the platform, a chronological feed appears here."
      />
    );
  }
  return (
    <Box sx={{ position: "relative", pl: 1 }}>
      {timeline.map((e, i) => {
        const meta = TYPE_META[e.type] || {
          icon: "mdi:circle",
          color: "#94a3b8",
          label: e.type,
        };
        const isLast = i === timeline.length - 1;
        return (
          <Box key={i} sx={{ display: "flex", gap: 2, position: "relative" }}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: `color-mix(in srgb, ${meta.color} 14%, transparent)`,
                  border: `2px solid color-mix(in srgb, ${meta.color} 40%, transparent)`,
                  zIndex: 1,
                }}
              >
                <IconWrapper icon={meta.icon} size={17} color={meta.color} />
              </Box>
              {!isLast && (
                <Box
                  sx={{
                    width: 2,
                    flex: 1,
                    minHeight: 24,
                    bgcolor: "color-mix(in srgb, var(--border-default) 80%, transparent)",
                  }}
                />
              )}
            </Box>
            <Box sx={{ pb: 2.5, minWidth: 0, flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography
                  sx={{
                    fontSize: "0.62rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    color: meta.color,
                  }}
                >
                  {meta.label}
                </Typography>
                <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>
                  {formatDateTime(e.timestamp)}
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 600, color: "var(--font-primary)", mt: 0.25 }}>
                {e.title || "Activity"}
                {e.score != null && (
                  <Box component="span" sx={{ ml: 1, color: meta.color, fontWeight: 800 }}>
                    {e.score}%
                  </Box>
                )}
              </Typography>
              {(e.course || e.activity_type || e.status) && (
                <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                  {[e.course, e.activity_type, e.status].filter(Boolean).join(" · ")}
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

export function TimelineTab({
  timeline,
  weeklyProgress,
}: {
  timeline: JourneyTimelineEntry[];
  weeklyProgress: JourneyCourseWeeks[];
}) {
  const [view, setView] = useState<"weekly" | "feed">("weekly");
  return (
    <Box>
      <ViewToggle view={view} onChange={setView} />
      {view === "weekly" ? (
        <WeeklyView weeklyProgress={weeklyProgress} />
      ) : (
        <ActivityFeed timeline={timeline} />
      )}
    </Box>
  );
}
