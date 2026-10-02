"use client";

import { useState } from "react";
import { usePathname, useParams } from "next/navigation";
import { Fab, Tooltip } from "@mui/material";
import { IconWrapper } from "./IconWrapper";
import { ReportIssueDialog } from "./ReportIssueDialog";
import { useAuth } from "@/lib/auth/auth-context";
import { PHONE } from "./mobile/phone";

export function ReportIssueFAB() {
  const pathname = usePathname();
  const params = useParams();
  const { isAuthenticated, user } = useAuth();
  const [showReportDialog, setShowReportDialog] = useState(false);

  // Routes where a floating support button is in the way rather than available: the ones a
  // learner is IN the middle of something on, with their own controls at the bottom of the
  // screen. A live tutor lesson is one of those - it ends up beside "End session", which is the
  // last button anybody wants to miss by a few pixels.
  //
  // `new` is deliberately still covered: that is the setup form, where somebody who cannot get a
  // lesson started is exactly who needs support. The recap is a normal page and keeps it too.
  const excludedRoutes = [
    /^\/assessments\/[^/]+\/take$/,
    /^\/mock-interview\/[^/]+\/take$/,
    /^\/ai-tutor\/session\/(?!new$)[^/]+$/,
  ];

  const shouldHide = excludedRoutes.some((pattern) =>
    pattern.test(pathname || "")
  );

  // Don't show if not authenticated or on excluded routes
  if (!isAuthenticated || shouldHide) {
    return null;
  }

  // Not for teaching staff. Their ticket surface is the cohort queue at /instructor/tickets —
  // a floating "report an issue" button pushed them into the learner raise-flow instead.
  const normalizedRole = String(user?.role ?? "").trim().toLowerCase().replace(/\s+/g, "_");
  if (["instructor", "course_manager"].includes(normalizedRole)) {
    return null;
  }

  // Extract courseId from params if on a course page
  let courseId: number | undefined;
  if (pathname?.startsWith("/courses/")) {
    courseId = params?.id ? Number(params.id) : undefined;
  }

  return (
    <>
      <Tooltip title="Support and Help" placement="left">
        <Fab
          aria-label="support and help"
          onClick={() => setShowReportDialog(true)}
          sx={{
            position: "fixed",
            bottom: { xs: 80, md: 24 },
            insetInlineEnd: { xs: 16, md: 24 },
            // The phone dock floats at safe-area + 10px and is ~66px tall. 80px from the screen
            // edge put this button's bottom inside the dock on any iPhone with a home indicator
            // (34px inset). Clear the dock's top by 12px wherever the inset is.
            [PHONE]: { bottom: "calc(env(safe-area-inset-bottom, 0px) + 88px)" },
            backgroundColor: "#4285f4",
            "&:hover": {
              backgroundColor: "#3367d6",
            },
            zIndex: 1000,
          }}
        >
          <IconWrapper icon="mdi:headset" size={24} color="#ffffff" />
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
