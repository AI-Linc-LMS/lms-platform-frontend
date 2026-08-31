"use client";

import NextLink from "next/link";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { JobApplicationV2 } from "@/lib/services/jobs-v2.service";
import { formatDate } from "@/lib/jobs-v2/format";
import { CompanyLogo, JCard, J, R, TYPE, focusRing, lineClamp } from "@/components/jobs-v2/ui";

/**
 * The offer banner.
 *
 * It used to be a green gradient wash with a 4px gradient top bar and rows painted on
 * `color-mix(in srgb, var(--font-light) 60%, transparent)` — the white *text* token used as a
 * surface, which inverts under any tenant palette that is not white. It is now a plain `JCard`
 * with the module's own gradient hairline on its top edge, and each row links to the
 * **application**, which is where the offer actually lives, not to the job posting.
 */
export function PlacementBanner({ applications }: { applications: JobApplicationV2[] }) {
  const { t } = useTranslation("common");
  if (!applications.length) return null;

  return (
    <JCard
      accent="azure"
      sx={{ mb: 2.5 }}
      role="region"
      aria-label={t("jobsV2.applied.offerTitle", { defaultValue: "Offer received" }) as string}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.75, mb: 2 }}>
        <Box
          aria-hidden
          sx={{
            width: 48,
            height: 48,
            flexShrink: 0,
            borderRadius: R.inner,
            display: "grid",
            placeItems: "center",
            bgcolor: J.successBg,
            border: `1px solid ${J.successBd}`,
            color: J.successFg,
          }}
        >
          <IconWrapper icon="mdi:trophy-outline" size={26} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h2" sx={TYPE.h3}>
            {t("jobsV2.applied.offerTitle", { defaultValue: "Offer received" })}
          </Typography>
          <Typography sx={{ ...TYPE.small, mt: 0.25 }}>
            {t("jobsV2.applied.offerBody", {
              count: applications.length,
              defaultValue: "Congratulations. Open the application to see the details.",
            })}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {applications.map((app) => (
          <Box
            key={app.id}
            component={NextLink}
            href={`/jobs-v2/applications/${app.id}`}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 1.5,
              py: 1.25,
              minHeight: 56,
              borderRadius: R.inner,
              border: `1px solid ${J.successBd}`,
              bgcolor: J.successBg,
              textDecoration: "none",
              color: J.ink,
              "&:hover": { filter: "brightness(0.98)" },
              ...focusRing,
            }}
          >
            <CompanyLogo src={undefined} name={app.company_name} size={32} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ ...TYPE.h4, ...lineClamp(1) }} title={app.job_title}>
                {app.job_title}
              </Typography>
              <Typography sx={{ ...TYPE.micro, color: J.successFg }}>
                {app.company_name}
                {" · "}
                {t("jobsV2.applied.offerSince", {
                  date: formatDate(app.updated_at || app.applied_at),
                  defaultValue: "Updated {{date}}",
                })}
              </Typography>
            </Box>
            <Box aria-hidden sx={{ color: J.successFg, display: "inline-flex" }}>
              <IconWrapper icon="mdi:arrow-right" size={18} />
            </Box>
          </Box>
        ))}
      </Box>
    </JCard>
  );
}
