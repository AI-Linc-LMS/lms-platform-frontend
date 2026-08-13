"use client";

import { useEffect, useState } from "react";
import { Box, Button, Skeleton, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { formatMoney } from "@/lib/utils/money";
import {
  adaptiveCourseService,
  type AdaptiveCourseListItem,
} from "@/lib/services/adaptive-course.service";
import { useB2CAllowance } from "@/lib/hooks/useB2CAllowance";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";

/** How many to show before deferring to the catalog. Three fills the slot without turning the
 *  dashboard into a second storefront. */
const PREVIEW_COUNT = 3;

/**
 * What a learner with no courses sees where the course card would be.
 *
 * A rocket icon and a button told them to go somewhere else. This shows the actual courses they
 * can start, with prices — which on a self-serve tenant is the product itself, and on any tenant
 * is more use than an empty box.
 *
 * Falls back to the plain call-to-action whenever there is nothing to list: a tenant whose admins
 * assign every course has an empty catalog by design, and a list of nothing would be worse than
 * the button it replaced.
 */
export function FirstRunCoursesPanel({ fallback }: { fallback: React.ReactNode }) {
  const { push } = useInstantNavigation();
  const { isB2C, freeCoursesLeft } = useB2CAllowance();
  const [courses, setCourses] = useState<AdaptiveCourseListItem[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await adaptiveCourseService.getCatalog();
        if (alive) setCourses(list);
      } catch {
        // A failed catalog is not an error worth showing on a dashboard — it just means we fall
        // back to the plain CTA, which always works.
        if (alive) setCourses([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (courses === null) {
    return <Skeleton variant="rounded" height={232} sx={{ borderRadius: 4 }} />;
  }
  if (courses.length === 0) return <>{fallback}</>;

  const preview = courses.slice(0, PREVIEW_COUNT);

  return (
    <Box sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 4, border: "1px solid #eef2f7", bgcolor: "#faf9ff" }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
        <Icon icon="mdi:rocket-launch-outline" width={20} color="#7c3aed" />
        <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a" }}>
          Start your learning journey
        </Typography>
      </Stack>
      <Typography sx={{ color: "#64748b", fontSize: "0.9rem", mb: 2 }}>
        {isB2C && freeCoursesLeft > 0
          ? freeCoursesLeft === 1
            ? "Pick your first course — it's on us."
            : `Pick a course — you have ${freeCoursesLeft} free ones.`
          : "Pick a course and the engine meets you at your level, adapting as you go."}
      </Typography>

      <Stack spacing={1}>
        {preview.map((course) => (
          <Box
            key={course.id}
            onClick={() => push("/adaptive-courses/catalog")}
            sx={{
              display: "flex", alignItems: "center", gap: 1.5, p: 1.5,
              borderRadius: 2.5, bgcolor: "#fff", border: "1px solid #eef2f7",
              cursor: "pointer", transition: "border-color .15s ease",
              "&:hover": { borderColor: "#c4b5fd" },
            }}
          >
            <Box sx={{
              width: 36, height: 36, borderRadius: 2, flexShrink: 0, display: "grid",
              placeItems: "center", background: "linear-gradient(135deg,#7c3aed,#a855f7)",
            }}>
              <Icon icon="mdi:book-open-variant" width={18} color="#fff" />
            </Box>
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography noWrap sx={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>
                {course.title}
              </Typography>
              <Typography noWrap sx={{ color: "#64748b", fontSize: "0.78rem" }}>
                {course.module_count ? `${course.module_count} modules` : "Adaptive course"}
              </Typography>
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: "#7c3aed", flexShrink: 0 }}>
              {course.is_paid && course.price
                ? formatMoney(course.price, course.currency)
                : "Free"}
            </Typography>
          </Box>
        ))}
      </Stack>

      <Button
        onClick={() => push("/adaptive-courses/catalog")}
        variant="contained"
        fullWidth
        endIcon={<Icon icon="mdi:arrow-right" width={18} />}
        sx={{
          mt: 2, textTransform: "none", fontWeight: 800, borderRadius: 2, py: 1,
          background: "linear-gradient(135deg,#7c3aed,#db2777)",
        }}
      >
        {courses.length > PREVIEW_COUNT ? `Browse all ${courses.length} courses` : "Browse courses"}
      </Button>
    </Box>
  );
}
