"use client";

import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layout/MainLayout";
import { JobsScope, ErrorState, JButton } from "@/components/jobs-v2/ui";

/**
 * The route error boundary for every student jobs screen.
 *
 * There was none anywhere under `/jobs-v2`, so a render error took the whole layout with it and
 * the learner lost the sidebar too. `reset()` is wired to the kit's Retry, so the recovery is
 * the same control and the same language as every other failure in the module.
 */
export default function JobsV2Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useTranslation("common");
  return (
    <MainLayout fullWidthContent>
      <JobsScope surface="student">
        <ErrorState
          variant="page"
          title={t("jobsV2.error.title")}
          body={t("jobsV2.error.body")}
          error={error?.message}
          onRetry={reset}
          secondaryAction={
            <JButton variant="ghost" href="/jobs-v2" startIcon="mdi:briefcase-search">
              {t("jobsV2.empty.browseJobs")}
            </JButton>
          }
          sx={{ mt: 3 }}
        />
      </JobsScope>
    </MainLayout>
  );
}
