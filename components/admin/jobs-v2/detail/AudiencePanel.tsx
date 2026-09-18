"use client";

import { useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { J, JButton, JCard, R, SkillChip, TYPE } from "@/components/jobs-v2/ui";
import { AudienceSummary } from "../form/AudienceSummary";
import { BatchTargeting } from "./BatchTargeting";

const NAMES_SHOWN = 8;

/* ==========================================================================
 * "Who can see this job" — the single most important card the admin detail page was missing.
 *
 * `assigned_students` and adaptive targeting were invisible on that page, so the question the
 * screen exists to answer was literally unanswerable from it. All FOUR mechanisms are listed
 * here, and the headline sentence is the same helper step 4 of the form renders, so the two
 * cannot disagree.
 * ======================================================================== */
export function AudiencePanel({
  job,
  onCohortsChange,
}: {
  job: JobV2;
  /** Called with the job's batches after the admin posts it to, or takes it off, a batch. */
  onCohortsChange?: (cohorts: Array<{ id: number; name: string }>) => void;
}) {
  const { t } = useTranslation("common");
  const [showAllNames, setShowAllNames] = useState(false);

  const courses = useMemo(() => job.courses ?? [], [job.courses]);
  const adaptive = useMemo(() => job.adaptive_courses ?? [], [job.adaptive_courses]);
  const students = useMemo(() => job.assigned_students ?? [], [job.assigned_students]);
  const colleges = useMemo(() => job.college_mappings ?? [], [job.college_mappings]);
  const batches = useMemo(() => job.cohorts ?? [], [job.cohorts]);

  const visibleStudents = showAllNames ? students : students.slice(0, NAMES_SHOWN);
  const unused = [
    adaptive.length === 0 && (t("jobsV2.audience.unusedCourses", "courses") as string),
    students.length === 0 && (t("jobsV2.audience.unusedStudents", "named students") as string),
    colleges.length === 0 && (t("jobsV2.audience.unusedColleges", "colleges (every college qualifies)") as string),
  ].filter(Boolean) as string[];

  return (
    <JCard sx={{ mb: 2 }}>
      <AudienceSummary
        variant="inline"
        courseTitles={adaptive.map((c) => c.title ?? `#${c.id}`)}
        retiredCourseTitles={courses.map((c) => c.title)}
        collegeNames={colleges.map((c) => c.college_name)}
        batchNames={batches.map((b) => b.name)}
        studentCount={students.length}
        published={Boolean(job.is_published)}
      />

      <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        {adaptive.length > 0 && (
          <Mechanism
            label={t("jobsV2.form.courses", "Courses")}
            empty=""
            items={adaptive.map((c) => c.title ?? `#${c.id}`)}
          />
        )}
        {courses.length > 0 && (
          <Mechanism
            label={t("jobsV2.audience.retiredCourses", "Retired course tags")}
            empty=""
            items={courses.map((c) => c.title)}
            note={t(
              "jobsV2.audience.retiredCoursesNote",
              "These no longer affect who sees this job. Its audience is the courses, batches, colleges and named students above.",
            )}
          />
        )}
        <BatchTargeting
          jobId={job.id}
          posted={batches}
          otherwiseTargeted={adaptive.length > 0 || students.length > 0 || colleges.length > 0}
          published={Boolean(job.is_published)}
          onChange={(next) => onCohortsChange?.(next)}
        />
        {students.length > 0 && (
        <Box>
          <Typography sx={{ ...TYPE.label, mb: 0.75 }}>
            {t("jobsV2.form.assignedStudents", "Individually assigned students")}
          </Typography>
          {(
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
        )}
        {colleges.length > 0 && (
          <Mechanism
            label={t("jobsV2.form.colleges", "College mapping")}
            empty=""
            items={colleges.map((c) =>
              [c.college_name, c.department, c.batch].filter(Boolean).join(" · "),
            )}
          />
        )}
        {/* The mechanisms NOT in use, on one line. Each used to be its own row of empty-state
            text, which made this card most of the page's right column on a short posting. */}
        {unused.length > 0 && (
          <Typography data-testid="audience-unused" sx={TYPE.micro}>
            {t("jobsV2.audience.notNarrowedBy", "Not narrowed by: {{list}}", { list: unused.join(", ") })}
          </Typography>
        )}
      </Box>
    </JCard>
  );
}

function Mechanism({
  label,
  items,
  empty,
  note,
}: {
  label: string;
  items: string[];
  empty: string;
  /** Why this row is here at all, when the row does not answer that on its own. */
  note?: string;
}) {
  return (
    <Box>
      <Typography sx={{ ...TYPE.label, mb: 0.75 }}>{label}</Typography>
      {note ? <Typography sx={{ ...TYPE.micro, mb: 0.75 }}>{note}</Typography> : null}
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
