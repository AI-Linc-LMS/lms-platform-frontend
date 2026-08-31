"use client";

import { useParams } from "next/navigation";
import { JobDetailView } from "@/components/admin/jobs-v2/detail/JobDetailView";

/**
 * The route renders the view and nothing else. Every piece of chrome — the header, the
 * breadcrumb, the states — belongs to `JobDetailView`, so the page and its `loading.tsx`
 * cannot drift into two different designs.
 */
export default function AdminJobDetailPage() {
  const params = useParams();
  const raw = params?.id;
  const jobId = Number(Array.isArray(raw) ? raw[0] : raw);
  return <JobDetailView jobId={jobId} />;
}
