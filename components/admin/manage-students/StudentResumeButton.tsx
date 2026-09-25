"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, Tooltip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { PHONE_TAP } from "@/components/admin/manage-students/mobile";
import { StudentResumeDialog } from "./StudentResumeDialog";

/* ==========================================================================
 * "View resume" on a student's profile, and the dialog behind it.
 *
 * The profile header offered this button to every student, so an admin who opened a learner with
 * no resume was told, one click later, that there is nothing - while Manage Students had already
 * said "No" in the column they came from. The button and the column now answer to the same fact:
 * `has_saved_resume`, which the server computes once for both (`accounts/resume_presence.py`).
 *
 * `hasSavedResume === undefined` means the server did not say - an older backend. Then the button
 * stays available: refusing to open a resume that is there is worse than offering one that is not.
 * ======================================================================== */

export interface StudentResumeButtonProps {
  studentId: number | null;
  studentName?: string;
  /** The student's own indicator. `false` disables the button; `undefined` is "not stated". */
  hasSavedResume?: boolean;
}

export function StudentResumeButton({ studentId, studentName, hasSavedResume }: StudentResumeButtonProps) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const none = hasSavedResume === false;

  const button = (
    <Button
      variant="outlined"
      size="small"
      disabled={none}
      data-testid="view-resume-button"
      startIcon={<IconWrapper icon="mdi:file-account-outline" size={18} />}
      onClick={() => setOpen(true)}
      sx={{
        borderColor: "var(--accent-indigo)",
        color: "var(--accent-indigo)",
        fontWeight: 700,
        ...PHONE_TAP,
      }}
    >
      {t("adminManageStudents.resumeViewer.view", "View resume")}
    </Button>
  );

  return (
    <>
      <Tooltip
        title={
          none
            ? t("adminManageStudents.resumeViewer.noneToView", "This student has not saved a resume")
            : ""
        }
      >
        {/* A disabled button fires no events, so the tooltip needs an element that does. */}
        <Box component="span" sx={{ display: "inline-flex" }}>
          {button}
        </Box>
      </Tooltip>
      <StudentResumeDialog
        open={open}
        onClose={() => setOpen(false)}
        studentId={studentId}
        studentName={studentName}
      />
    </>
  );
}
