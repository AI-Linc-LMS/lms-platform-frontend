"use client";

import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { J, JCard, MicroRuleList, R, TYPE } from "@/components/jobs-v2/ui";

/* ==========================================================================
 * ONE sentence that states who can see this job — computed once, rendered in two places.
 *
 * The Targeting step and the "Assign to specific students" dialog used to contradict each
 * other seconds apart ("Leave empty for all students" under courses vs "Only the students you
 * pick will see this opening" in the dialog). Both now render THIS component from THIS helper,
 * so they physically cannot disagree.
 * ======================================================================== */

export interface AudienceInput {
  courseTitles: string[];
  adaptiveTitles: string[];
  studentCount: number;
  collegeNames: string[];
  /** Newly added students, i.e. those not already assigned on the server. Drives the email line. */
  newStudentCount?: number;
  published?: boolean;
}

export interface AudienceDescription {
  sentence: string;
  bullets: string[];
  /** True when nothing narrows the audience at all. */
  everyone: boolean;
}

export function useAudienceDescription(input: AudienceInput): AudienceDescription {
  const { t } = useTranslation("common");
  const { courseTitles, adaptiveTitles, studentCount, collegeNames, newStudentCount, published } =
    input;

  return useMemo(() => {
    const courseCount = courseTitles.length + adaptiveTitles.length;
    const collegeCount = collegeNames.length;
    const everyone = courseCount === 0 && studentCount === 0 && collegeCount === 0;

    const clauses: string[] = [];
    if (courseCount > 0) {
      clauses.push(
        t("jobsV2.audience.inCourses", "every student in {{count}} course(s)", {
          count: courseCount,
        }),
      );
    }
    if (studentCount > 0) {
      clauses.push(
        t("jobsV2.audience.namedStudents", "{{count}} named student(s)", { count: studentCount }),
      );
    }
    if (collegeCount > 0) {
      clauses.push(
        t("jobsV2.audience.inColleges", "students in {{count}} college(s)", {
          count: collegeCount,
        }),
      );
    }

    const sentence = everyone
      ? t("jobsV2.audience.everyone", "Visible to every student who can see this board.")
      : t("jobsV2.audience.visibleTo", "Visible to {{clauses}}.", {
          clauses: clauses.join(t("jobsV2.audience.join", ", plus ")),
        });

    const bullets: string[] = [];
    if (courseTitles.length) {
      bullets.push(
        t("jobsV2.audience.bulletCourses", "Courses: {{list}}", {
          list: courseTitles.join(", "),
        }),
      );
    }
    if (adaptiveTitles.length) {
      bullets.push(
        t("jobsV2.audience.bulletAdaptive", "Adaptive courses: {{list}}", {
          list: adaptiveTitles.join(", "),
        }),
      );
    }
    if (studentCount > 0) {
      bullets.push(
        t("jobsV2.audience.bulletStudents", "{{count}} individually assigned student(s)", {
          count: studentCount,
        }),
      );
    }
    if (collegeNames.length) {
      bullets.push(
        t("jobsV2.audience.bulletColleges", "Colleges: {{list}}", {
          list: collegeNames.join(", "),
        }),
      );
    }
    if ((newStudentCount ?? 0) > 0) {
      bullets.push(
        published
          ? t(
              "jobsV2.audience.bulletEmailNow",
              "{{count}} newly assigned student(s) are emailed as soon as you save.",
              { count: newStudentCount },
            )
          : t(
              "jobsV2.audience.bulletEmailLater",
              "{{count}} newly assigned student(s) are emailed once this job is published.",
              { count: newStudentCount },
            ),
      );
    }

    return { sentence, bullets, everyone };
  }, [adaptiveTitles, collegeNames, courseTitles, newStudentCount, published, studentCount, t]);
}

export interface AudienceSummaryProps extends AudienceInput {
  /** `panel` is the step-4 card; `inline` is the compact strip inside the student dialog. */
  variant?: "panel" | "inline";
}

export function AudienceSummary({ variant = "panel", ...input }: AudienceSummaryProps) {
  const { t } = useTranslation("common");
  const { sentence, bullets, everyone } = useAudienceDescription(input);

  const body = (
    <>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}>
        <Box
          aria-hidden
          sx={{
            width: 32,
            height: 32,
            flexShrink: 0,
            borderRadius: R.ctl,
            display: "grid",
            placeItems: "center",
            bgcolor: J.azureSoft,
            color: J.azure,
            border: `1px solid ${J.azureBorder}`,
          }}
        >
          <IconWrapper icon={everyone ? "mdi:earth" : "mdi:account-filter-outline"} size={18} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ ...TYPE.label, mb: 0.5 }}>
            {t("jobsV2.audience.heading", "Who can see this job")}
          </Typography>
          <Typography sx={{ ...TYPE.bodyStrong }}>{sentence}</Typography>
        </Box>
      </Box>
      {bullets.length > 0 && (
        <Box sx={{ mt: 1.5, pl: { xs: 0, sm: 5.5 } }}>
          <MicroRuleList items={bullets} />
        </Box>
      )}
    </>
  );

  if (variant === "inline") {
    return (
      <Box
        role="status"
        sx={{
          p: 1.5,
          borderRadius: R.card,
          border: `1px solid ${J.azureBorder}`,
          bgcolor: J.azureSoft,
        }}
      >
        {body}
      </Box>
    );
  }

  return (
    <JCard accent="azure" sx={{ mb: 2.5 }}>
      {body}
    </JCard>
  );
}
