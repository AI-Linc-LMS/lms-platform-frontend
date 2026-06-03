"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { PageShimmer } from "@/components/common/PageShimmer";

interface PageShimmerLayoutProps {
  rows?: number;
  variant?: "rows" | "grid" | "list" | "detail";
  hideHeader?: boolean;
}

/**
 * Drop-in loading screen rendered by `loading.tsx` route files. Keeps the
 * sidebar + app bar visible by wrapping the shimmer in `MainLayout`, so
 * clicks on nav items appear to swap pages instantly while real data loads.
 */
export default function PageShimmerLayout(props: PageShimmerLayoutProps) {
  return (
    <MainLayout>
      <PageShimmer {...props} />
    </MainLayout>
  );
}
