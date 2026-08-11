import PageShimmerLayout from "@/components/common/PageShimmerLayout";

// Route-segment shimmer - renders instantly as the navigation Suspense fallback so the page never
// flashes blank during the transition.
export default function Loading() {
  return <PageShimmerLayout variant="grid" />;
}
