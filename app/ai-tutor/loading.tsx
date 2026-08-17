import PageShimmerLayout from "@/components/common/PageShimmerLayout";

// Route-segment shimmer. Renders instantly as the navigation Suspense fallback, so clicking
// "AI Tutor" in the sidebar never flashes blank while the route chunk and its data resolve.
// The page's own skeletons take over from here.
export default function Loading() {
  return <PageShimmerLayout variant="grid" />;
}
