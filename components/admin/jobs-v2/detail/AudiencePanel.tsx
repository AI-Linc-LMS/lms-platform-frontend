"use client";

import { useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { J, JButton, JCard, R, SkillChip, TYPE } from "@/components/jobs-v2/ui";
import { AudienceSummary } from "../form/AudienceSummary";

const NAMES_SHOWN = 8;

/* ==========================================================================
 * "Who can see this job" — the single most important card the admin detail page was missing.
 *
 * `assigned_students` and adaptive targeting were invisible on that page, so the question the
 * screen exists to answer was literally unanswerable from it. All FOUR mechanisms are listed
 * here, and the headline sentence is the same helper step 4 of the form renders, so the two
 * cannot disagree.
 * ======================================================================== */
export function AudiencePanel({ job }: { job: JobV2 }) {
  const { t } = useTranslation("common");
  const [showAllNames, setShowAllNames] = useState(false);

  const courses = useMemo(() => job.courses ?? [], [job.courses]);
  const adaptive = useMemo(() => job.adaptive_courses ?? [], [job.adaptive_courses]);
  const students = useMemo(() => job.assigned_students ?? [], [job.assigned_students]);
  const colleges = useMemo(() => job.college_mappings ?? [], [job.college_mappings]);

  const visibleStudents = showAllNames ? students : students.slice(0, NAMES_SHOWN);

  return (
    <JCard sx={{ mb: 2 }}>
      <AudienceSummary
        variant="inline"
        courseTitles={courses.map((c) => c.title)}
        adaptiveTitles={adaptive.map((c) => c.title ?? `#${c.id}`)}
        collegeNames={colleges.map((c) => c.college_name)}
        studentCount={students.length}
        published={Boolean(job.is_published)}
      />

      <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        <Mechanism
          label={t("jobsV2.form.courses", "Courses")}
          empty={t("jobsV2.audience.noCourses", "No course targeting")}
          items={courses.map((c) => c.title)}
        />
        <Mechanism
          label={t("jobsV2.form.adaptiveCourses", "Adaptive courses")}
          empty={t("jobsV2.audience.noAdaptive", "No adaptive-course targeting")}
          items={adaptive.map((c) => c.title ?? `#${c.id}`)}
        />
        <Box>
          <Typography sx={{ ...TYPE.label, mb: 0.75 }}>
            {t("jobsV2.form.assignedStudents", "Individually assigned students")}
          </Typography>
          {students.length === 0 ? (
            <Typography sx={TYPE.micro}>
              {t("jobsV2.audience.noStudents", "No individually assigned students")}
            </Typography>
          ) : (
            <>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {visibleStudents.map((student) => (
                  <Box
                    key={student.id}
                    sx={{
                      px: 1,
                      py: 0.5,
                      borderRadius: R.ctl,
                      border: `1px solid ${J.hairline}`,
                      bgcolor: J.surface2,
                      minWidth: 0,
                    }}
                  >
                    <Typography sx={{ ...TYPE.micro, color: J.ink, fontWeight: 700 }}>
                      {student.name}
                    </Typography>
                    <Typography sx={{ ...TYPE.mono, fontSize: "0.6875rem" }}>
                      {student.email}
                    </Typography>
                  </Box>
                ))}
              </Box>
              {students.length > NAMES_SHOWN && (
                <JButton
                  variant="quiet"
                  size="sm"
                  onClick={() => setShowAllNames((prev) => !prev)}
                  sx={{ mt: 0.75, px: 0 }}
                >
                  {showAllNames
                    ? t("jobsV2.audience.showFewer", "Show fewer")
                    : t("jobsV2.audience.showAllStudents", "Show all {{count}} students", {
                        count: students.length,
                      })}
                </JButton>
              )}
            </>
          )}
        </Box>
        <Mechanism
          label={t("jobsV2.form.colleges", "College mapping")}
          empty={t("jobsV2.audience.noColleges", "No college mapping — every college qualifies")}
          items={colleges.map((c) =>
            [c.college_name, c.department, c.batch].filter(Boolean).join(" · "),
          )}
        />
      </Box>
    </JCard>
  );
}

function Mechanism({
  label,
  items,
  empty,
}: {
  label: string;
  items: string[];
  empty: string;
}) {
  return (
    <Box>
      <Typography sx={{ ...TYPE.label, mb: 0.75 }}>{label}</Typography>
      {items.length === 0 ? (
        <Typography sx={TYPE.micro}>{empty}</Typography>
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {items.map((item, index) => (
            <SkillChip key={`${item}-${index}`}>{item}</SkillChip>
          ))}
        </Box>
      )}
    </Box>
  );
}
