"use client";

import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { JCard, JTextField, SectionHeader, TYPE } from "@/components/jobs-v2/ui";
import { FieldGrid, FieldProvenance, type StepProps } from "./StepRole";

/* ==========================================================================
 * Step 3 — "Who can apply". ALL eligibility in one place.
 *
 * It used to be scattered across three of the four steps: the three percentages sat under
 * "Basic Info", UG/PG under "Description & Skills", and experience and salary under
 * "Compensation & Location" — while step 4 was called "Targeting". An admin could not see the
 * gates they were setting without walking the whole form.
 *
 * The percentages are clamped 0-100 in `onChange` (useJobForm), not by an advisory
 * `inputProps` that let 500% save fine.
 * ======================================================================== */
export function StepEligibility({ form, provenance }: StepProps) {
  const { t } = useTranslation("common");
  const { data, setField, setPercentage } = form;

  const percentField = (
    id: string,
    label: string,
    field: "min_10th_percentage" | "min_12th_percentage" | "min_graduation_percentage",
  ) => (
    <JTextField
      id={id}
      label={label}
      value={data[field] == null ? "" : String(data[field])}
      onChange={(v) => setPercentage(field, v)}
      type="number"
      min={0}
      max={100}
      inputMode="decimal"
      placeholder="60"
      helper={t("jobsV2.form.percentHint", "0 to 100. Leave empty for no minimum.")}
    />
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <SectionHeader
        icon="mdi:account-check-outline"
        title={t("jobsV2.form.stepEligibility", "Who can apply")}
        description={t(
          "jobsV2.form.stepEligibilityHint",
          "Every gate this job applies, in one place. Leave a field empty to apply no gate.",
        )}
      />

      <JCard>
        <Typography sx={{ ...TYPE.h3, mb: 2 }}>
          {t("jobsV2.form.experienceAndPay", "Experience and pay")}
        </Typography>
        <FieldGrid>
          <Box>
            <FieldProvenance source={provenance?.years_of_experience} />
            <JTextField
              id="years-of-experience"
              label={t("jobsV2.form.experience", "Years of experience")}
              value={data.years_of_experience ?? ""}
              onChange={(v) => setField("years_of_experience", v)}
              placeholder={t("jobsV2.form.experiencePlaceholder", "e.g. 0-2 years")}
            />
          </Box>
          <Box>
            <FieldProvenance source={provenance?.salary} />
            <JTextField
              id="salary"
              label={t("jobsV2.form.salary", "Salary")}
              value={data.salary ?? ""}
              onChange={(v) => setField("salary", v)}
              placeholder={t("jobsV2.form.salaryPlaceholder", "e.g. 8-12 LPA")}
            />
          </Box>
        </FieldGrid>
      </JCard>

      <JCard>
        <Typography sx={{ ...TYPE.h3, mb: 2 }}>
          {t("jobsV2.form.education", "Education")}
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <FieldGrid>
            <Box>
              <FieldProvenance source={provenance?.education} />
              <JTextField
                id="education"
                label={t("jobsV2.form.educationLevel", "Education")}
                value={data.education ?? ""}
                onChange={(v) => setField("education", v)}
                placeholder={t("jobsV2.form.educationPlaceholder", "e.g. B.Tech, B.E.")}
              />
            </Box>
            <Box>
              <FieldProvenance source={provenance?.department} />
              <JTextField
                id="department"
                label={t("jobsV2.form.department", "Department")}
                value={data.department ?? ""}
                onChange={(v) => setField("department", v)}
                placeholder={t("jobsV2.form.departmentPlaceholder", "e.g. Engineering")}
              />
            </Box>
          </FieldGrid>
          <FieldGrid>
            <JTextField
              id="ug-requirements"
              label={t("jobsV2.form.ug", "UG requirements")}
              value={data.ug_requirements ?? ""}
              onChange={(v) => setField("ug_requirements", v)}
              placeholder={t("jobsV2.form.ugPlaceholder", "Undergraduate requirements")}
            />
            <JTextField
              id="pg-requirements"
              label={t("jobsV2.form.pg", "PG requirements")}
              value={data.pg_requirements ?? ""}
              onChange={(v) => setField("pg_requirements", v)}
              placeholder={t("jobsV2.form.pgPlaceholder", "Postgraduate requirements")}
            />
          </FieldGrid>
          <JTextField
            id="passout-year"
            label={t("jobsV2.form.passoutYear", "Applicable passout year")}
            value={
              data.applicable_passout_year == null ? "" : String(data.applicable_passout_year)
            }
            onChange={(v) => setField("applicable_passout_year", v)}
            placeholder={t("jobsV2.form.passoutYearPlaceholder", "e.g. 2025 or 2024-2026")}
            sx={{ maxWidth: 320 }}
          />
        </Box>
      </JCard>

      <JCard>
        <Typography sx={{ ...TYPE.h3, mb: 0.5 }}>
          {t("jobsV2.form.academicMinimums", "Academic minimums")}
        </Typography>
        <Typography sx={{ ...TYPE.small, mb: 2 }}>
          {t(
            "jobsV2.form.academicMinimumsHint",
            "These three gates appear on the job's Eligibility card, so you can verify them without reopening this form.",
          )}
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: 2.5,
          }}
        >
          {percentField("min-10th", t("jobsV2.form.min10th", "Minimum 10th %"), "min_10th_percentage")}
          {percentField("min-12th", t("jobsV2.form.min12th", "Minimum 12th %"), "min_12th_percentage")}
          {percentField(
            "min-graduation",
            t("jobsV2.form.minGraduation", "Minimum graduation %"),
            "min_graduation_percentage",
          )}
        </Box>
      </JCard>
    </Box>
  );
}
