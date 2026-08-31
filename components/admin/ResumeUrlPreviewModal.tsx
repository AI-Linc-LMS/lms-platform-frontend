"use client";

import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { EmptyState, J, JButton, JModal, R } from "@/components/jobs-v2/ui";

interface ResumeUrlPreviewModalProps {
  open: boolean;
  onClose: () => void;
  resumeUrl: string | null;
  resumeName?: string;
}

/**
 * A candidate's resume, opened OVER the candidate modal rather than in place of it.
 *
 * Props are unchanged; the chrome is not. Its hardcoded `#fafafa`, `#f1f5f9` and
 * `rgba(0,0,0,0.08)` — which stayed light under every tenant palette and could not render in
 * dark at all — are `J.surface2` / `J.surface3` / `J.hairline` now, and the dialog shell is the
 * module's one `JModal` instead of a fifth bespoke Dialog.
 */
export function ResumeUrlPreviewModal({
  open,
  onClose,
  resumeUrl,
  resumeName = "Resume",
}: ResumeUrlPreviewModalProps) {
  const { t } = useTranslation("common");

  return (
    <JModal
      open={open}
      onClose={onClose}
      size="xl"
      icon="mdi:file-document-outline"
      title={resumeName}
      description={resumeUrl ?? undefined}
      footer={
        <>
          <JButton variant="ghost" onClick={onClose}>
            {t("jobsV2.modal.close")}
          </JButton>
          {resumeUrl && (
            <JButton
              variant="secondary"
              href={resumeUrl}
              external
              endIcon="mdi:open-in-new"
            >
              {t("jobsV2.resume.openInTab", "Open in a new tab")}
            </JButton>
          )}
        </>
      }
    >
      {resumeUrl ? (
        <Box
          sx={{
            borderRadius: R.inner,
            border: `1px solid ${J.hairline}`,
            bgcolor: J.surface3,
            overflow: "hidden",
          }}
        >
          <Box
            component="iframe"
            src={resumeUrl}
            title={resumeName}
            sx={{ width: "100%", height: { xs: "60dvh", md: "68dvh" }, border: "none", display: "block" }}
          />
        </Box>
      ) : (
        <EmptyState
          variant="panel"
          icon="mdi:file-remove-outline"
          title={t("jobsV2.resume.noneTitle", "No resume to show")}
          body={t(
            "jobsV2.resume.noneBody",
            "This application has no resume URL attached to it.",
          )}
        />
      )}
    </JModal>
  );
}
