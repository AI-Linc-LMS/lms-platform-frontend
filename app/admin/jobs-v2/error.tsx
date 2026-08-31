"use client";

import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ErrorState, JButton, JobsScope } from "@/components/jobs-v2/ui";

/**
 * The admin jobs error boundary. There was no error boundary anywhere under `app/admin/`, so a
 * render fault here unmounted the whole layout and took the sidebar with it. Now the failure is
 * one route wide, it says so, and `reset()` is wired to a real Retry.
 *
 * It covers every nested admin jobs route that does not declare its own boundary — the list,
 * the scraped queue, reports, detail, the form and the applications pipeline.
 */
export default function AdminJobsV2Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation("common");
  return (
    <JobsScope surface="admin">
      <Box sx={{ py: { xs: 4, md: 6 } }}>
        <ErrorState
          variant="page"
          title={t("jobsV2.admin.errorTitle", "This page stopped working") as string}
          body={
            t(
              "jobsV2.admin.errorBody",
              "Nothing you have posted was lost. Try again, and if it keeps happening send the message below to support.",
            ) as string
          }
          error={error?.message || error?.digest || null}
          onRetry={reset}
          secondaryAction={
            <JButton variant="secondary" href="/admin/jobs-v2" startIcon="mdi:arrow-left">
              {t("jobsV2.admin.backToJobs", "Back to jobs")}
            </JButton>
          }
        />
      </Box>
    </JobsScope>
  );
}
