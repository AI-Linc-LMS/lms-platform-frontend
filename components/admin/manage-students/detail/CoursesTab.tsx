"use client";

import { useState } from "react";
import { Box, Typography, ButtonBase, Collapse } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import type {
  JourneyCourse,
  JourneyModule,
} from "@/lib/services/admin/admin-student.service";
import { ADAPTIVE, EmptyState, ProgressBar, formatDate } from "./shared";

function ModuleRow({ module }: { module: JourneyModule }) {
  const [open, setOpen] = useState(false);
  return (
    <Box
      sx={{
        borderRadius: 2,
        border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
        overflow: "hidden",
        backgroundColor: open
          ? "color-mix(in srgb, var(--accent-indigo) 4%, transparent)"
          : "transparent",
      }}
    >
      <ButtonBase
        onClick={() => setOpen((v) => !v)}
        sx={{
          width: "100%",
          px: 1.5,
          py: 1.25,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          textAlign: "left",
        }}
      >
        <Box
          sx={{
            px: 0.9,
            py: 0.3,
            borderRadius: 1,
            fontSize: "0.66rem",
            fontWeight: 800,
            color: ADAPTIVE.indigo,
            bgcolor: "color-mix(in srgb, #6366f1 14%, transparent)",
            flexShrink: 0,
          }}
        >
          W{module.weekno}
        </Box>
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: "0.88rem",
            color: "var(--font-primary)",
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {module.title}
        </Typography>
        <Box sx={{ width: 140, flexShrink: 0, display: { xs: "none", sm: "block" } }}>
          <ProgressBar value={module.progress_percentage} />
        </Box>
        <Typography
          sx={{ fontSize: "0.72rem", color: "var(--font-secondary)", flexShrink: 0 }}
        >
          {module.completed}/{module.total}
        </Typography>
        <IconWrapper
          icon={open ? "mdi:chevron-up" : "mdi:chevron-down"}
          size={18}
          color="var(--font-secondary)"
        />
      </ButtonBase>
      <Collapse in={open}>
        <Box sx={{ px: 1.5, pb: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
          {module.submodules.length === 0 ? (
            <Typography variant="caption" sx={{ color: "var(--font-secondary)", pl: 1 }}>
              No submodules.
            </Typography>
          ) : (
            module.submodules.map((sub) => (
              <Box
                key={sub.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  pl: 1,
                }}
              >
                <IconWrapper
                  icon={
                    sub.completed >= sub.total && sub.total > 0
                      ? "mdi:check-circle"
                      : "mdi:circle-outline"
                  }
                  size={16}
                  color={
                    sub.completed >= sub.total && sub.total > 0
                      ? ADAPTIVE.green
                      : "var(--font-tertiary)"
                  }
                />
                <Typography
                  sx={{
                    fontSize: "0.82rem",
                    color: "var(--font-primary)",
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {sub.title}
                </Typography>
                <Box sx={{ width: 130, flexShrink: 0 }}>
                  <ProgressBar value={sub.progress_percentage} height={6} />
                </Box>
                <Typography
                  sx={{ fontSize: "0.7rem", color: "var(--font-secondary)", minWidth: 38, textAlign: "right" }}
                >
                  {sub.completed}/{sub.total}
                </Typography>
              </Box>
            ))
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

function CourseCard({ course }: { course: JourneyCourse }) {
  const [open, setOpen] = useState(false);
  return (
    <Box
      sx={{
        borderRadius: 3,
        border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
        backgroundColor: "var(--card-bg)",
        overflow: "hidden",
      }}
    >
      <ButtonBase
        onClick={() => setOpen((v) => !v)}
        sx={{
          width: "100%",
          px: { xs: 2, md: 2.5 },
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          textAlign: "left",
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            background: ADAPTIVE.gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IconWrapper icon="mdi:book-open-variant" size={22} color="#fff" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 700,
              color: "var(--font-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {course.title}
          </Typography>
          <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
            {course.completed_contents}/{course.total_contents} items · {course.marks} marks ·
            last active {formatDate(course.last_activity)}
          </Typography>
        </Box>
        <Box sx={{ width: 160, flexShrink: 0, display: { xs: "none", sm: "block" } }}>
          <ProgressBar value={course.progress_percentage} />
        </Box>
        <IconWrapper
          icon={open ? "mdi:chevron-up" : "mdi:chevron-down"}
          size={20}
          color="var(--font-secondary)"
        />
      </ButtonBase>
      <Collapse in={open}>
        <Box
          sx={{
            px: { xs: 1.5, md: 2 },
            pb: 2,
            pt: 0.5,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {course.modules.length === 0 ? (
            <Typography variant="body2" sx={{ color: "var(--font-secondary)", p: 1 }}>
              This course has no modules yet.
            </Typography>
          ) : (
            course.modules.map((m) => <ModuleRow key={m.id} module={m} />)
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

export function CoursesTab({ courses }: { courses: JourneyCourse[] }) {
  if (!courses || courses.length === 0) {
    return (
      <EmptyState
        icon="mdi:book-off-outline"
        title="Not enrolled in any course"
        hint="Enroll this student in a course to see content progress here."
      />
    );
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {courses.map((c) => (
        <CourseCard key={c.id} course={c} />
      ))}
    </Box>
  );
}
