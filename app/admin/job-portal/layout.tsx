"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { AdminJobPortalGuard } from "@/components/job-portal-v2";

export default function AdminJobPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MainLayout>
      <AdminJobPortalGuard>{children}</AdminJobPortalGuard>
    </MainLayout>
  );
}
