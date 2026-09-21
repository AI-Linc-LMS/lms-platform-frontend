"use client";

import { useParams } from "next/navigation";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { Box, ButtonBase } from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { JourneyBoard } from "@/components/adaptive-journey/JourneyBoard";
import { PHONE } from "@/components/common/mobile/phone";

/**
 * Phone only: take the decorative shell off the course page.
 *
 * MainLayout already pads the page 16px, this page padded another 16px, and the shell another
 * 20px, so every card inside it - the hero, the week cards, the topic rows - was drawn in 284px of
 * a 390px screen, a card inside a card inside a card. On a phone the hero and the week cards ARE
 * the cards; the shell's border, mesh and padding go, and the content gets the full 358px.
 *
 * Targets SectionShell's two layers (the mesh, then the padded content box) by position, since it
 * takes no props for this. Wider screens are untouched.
 */
const FLATTEN_SHELL_ON_PHONE = {
  [PHONE]: {
    "& > .MuiBox-root": {
      border: 0,
      borderRadius: 0,
      boxShadow: "none",
      backgroundColor: "transparent",
      backdropFilter: "none",
      overflow: "visible",
    },
    "& > .MuiBox-root > [aria-hidden]": { display: "none" },
    "& > .MuiBox-root > .MuiBox-root:last-of-type": { p: 0 },
  },
};

export default function AdaptiveCourseDetailPage() {
  const { push } = useInstantNavigation();
  const params = useParams();
  const courseId = Number(params.courseId);
  // NOTE: there used to be a getCourse() fetch here to populate an instructor chip. It was dead:
  // this endpoint is served by LearnerCourseDetailSerializer, whose field list does NOT include
  // `instructors`, so the value was always undefined and the chip never rendered — while the request
  // itself dragged the entire course tree (modules -> submodules -> per-item counts, an N+1 on the
  // backend) on every visit to this page. Removed; JourneyBoard already drives the whole render off
  // the journey payload.

  // JourneyBoard fetches the journey (which already returns the course) and renders
  // its own loading skeleton, 403 "not enrolled" state, and errors - so there is no
  // page-level getCourse pre-fetch for the main content (that was a redundant round-trip).
  return (
    <MainLayout fullWidthContent>
      <Box sx={{ maxWidth: 1760, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 5 }, [PHONE]: { px: 0, pt: 0, pb: 1 } }}>
        <ButtonBase
          onClick={() => push("/adaptive-courses")}
          sx={{
            mb: 2, color: "#6366f1", fontWeight: 700, gap: 0.5, fontSize: "0.9rem",
            // A 22px text link was the smallest target on the page; on a phone it gets a 44px row.
            [PHONE]: { minHeight: 44, mb: 1, pr: 1.5, borderRadius: 2 },
          }}
        >
          <Icon icon="mdi:arrow-left" width={18} />
          Back to Adaptive Courses
        </ButtonBase>

        <Box sx={FLATTEN_SHELL_ON_PHONE}>
          <AdaptiveSectionShell meshOpacity={0.18}>
            {Number.isFinite(courseId) && <JourneyBoard courseId={courseId} />}
          </AdaptiveSectionShell>
        </Box>
      </Box>
    </MainLayout>
  );
}
