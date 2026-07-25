import PageShimmerLayout from "@/components/common/PageShimmerLayout";

// Route-segment shimmer - renders instantly as the navigation Suspense fallback so the page never
// flashes blank during the transition; the page's own skeleton takes over while its API loads.
export default function Loading() {
  return <PageShimmerLayout variant="detail" />;
}
