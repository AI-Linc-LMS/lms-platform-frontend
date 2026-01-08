"use client";

import { useState } from "react";
import { usePathname, useParams } from "next/navigation";
import { Fab, Tooltip } from "@mui/material";
import { IconWrapper } from "./IconWrapper";
import { ReportIssueDialog } from "./ReportIssueDialog";
import { useAuth } from "@/lib/auth/auth-context";

export function ReportIssueFAB() {
  const pathname = usePathname();
  const params = useParams();
  const { isAuthenticated } = useAuth();
  const [showReportDialog, setShowReportDialog] = useState(false);

  // Exclude routes: assessments/[slug]/take and mock-interview/[id]/take
  const excludedRoutes = [
    /^\/assessments\/[^/]+\/take$/,
    /^\/mock-interview\/[^/]+\/take$/,
  ];

  const shouldHide = excludedRoutes.some((pattern) =>
    pattern.test(pathname || "")
  );

  // Don't show if not authenticated or on excluded routes
  if (!isAuthenticated || shouldHide) {
    return null;
  }

  // Extract courseId from params if on a course page
  let courseId: number | undefined;
  if (pathname?.startsWith("/courses/")) {
    courseId = params?.id ? Number(params.id) : undefined;
  }

  return (
    <>
      <Tooltip title="Report an Issue" placement="left">
        <Fab
          color="error"
          aria-label="report issue"
          onClick={() => setShowReportDialog(true)}
          sx={{
            position: "fixed",
            bottom: { xs: 80, md: 24 },
            right: { xs: 16, md: 24 },
            backgroundColor: "#ef4444",
            "&:hover": {
              backgroundColor: "#dc2626",
            },
            zIndex: 1000,
          }}
        >
          <IconWrapper icon="mdi:alert-circle" size={24} color="#ffffff" />
        </Fab>
      </Tooltip>

      <ReportIssueDialog
        open={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        courseId={courseId}
      />
    </>
  );
}
