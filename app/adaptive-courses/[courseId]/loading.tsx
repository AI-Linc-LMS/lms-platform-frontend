import { Box } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { JourneyBoardSkeleton } from "@/components/courses/CourseSkeletons";

// Route-segment shimmer — matches the page's shell (MainLayout + AdaptiveSectionShell)
// and its actual JourneyBoardSkeleton, so the navigation transition shows ONE
// consistent skeleton instead of a generic shimmer that then morphs into the page's
// own skeleton. The page renders the same JourneyBoardSkeleton (via JourneyBoard)
// while its journey API loads, so there is no visible shape change between phases.
export default function Loading() {
  return (
    <MainLayout fullWidthContent>
      <Box sx={{ maxWidth: 1760, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 5 } }}>
        <AdaptiveSectionShell meshOpacity={0.18}>
          <JourneyBoardSkeleton />
        </AdaptiveSectionShell>
      </Box>
    </MainLayout>
  );
}
