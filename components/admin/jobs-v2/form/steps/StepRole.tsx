"use client";

import { useState, type ReactNode } from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  CompanyLogo,
  J,
  JButton,
  JCard,
  JSelect,
  JTextField,
  R,
  RequiredLegend,
  SectionHeader,
  TYPE,
  focusRing,
} from "@/components/jobs-v2/ui";
import type { JobFormApi } from "../useJobForm";

/* ==========================================================================
 * Step 1 — "The role".
 *
 * The steps were re-partitioned because the shipped ones lied about their contents: "Basic
 * Info" held three eligibility percentages, "Description & Skills" held UG/PG requirements, and
 * "Compensation & Location" held Job Type, Employment Type, Industry and Role Category. This
 * step now holds exactly what identifies the role.
 *
 * Two atoms shared by the other three steps are exported from here rather than from a fifth
 * file, so the form's file set stays exactly the one the spec names (section 9, Group 5).
 * StepRole imports nothing from its siblings, so there is no cycle.
 * ======================================================================== */

/**
 * The per-field provenance marker for a scraped prefill. Sits directly above the control's own
 * label, so it reads for every control type — including the Selects, which have no icon slot.
 */
export function FieldProvenance({ source }: { source?: string | null }) {
  const { t } = useTranslation("common");
  if (!source) return null;
  const text = t("jobsV2.form.prefilledFrom", "From {{source}} — review before publishing", {
    source,
  });
  return (
    <Tooltip title={text}>
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          mb: 0.5,
          color: J.azure,
          cursor: "help",
        }}
      >
        <IconWrapper icon="mdi:radar" size={12} />
        <Typography component="span" sx={{ ...TYPE.micro, color: J.azure }}>
          {text}
        </Typography>
      </Box>
    </Tooltip>
  );
}

export interface ChipBinFieldProps {
  label: string;
  helper?: string;
  placeholder: string;
  addLabel: string;
  values: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  emptyHint: string;
  id: string;
  tone?: "azure" | "neutral";
}

/**
 * The one chip-bin editor: skills (must-have and nice-to-have) and college mappings.
 *
 * Chips are real buttons with an accessible name, not MUI `Chip onDelete` icons whose only
 * label is a cross glyph.
 */
export function ChipBinField({
  label,
  helper,
  placeholder,
  addLabel,
  values,
  onAdd,
  onRemove,
  emptyHint,
  id,
  tone = "azure",
}: ChipBinFieldProps) {
  const { t } = useTranslation("common");
  const [draft, setDraft] = useState("");

  const commit = () => {
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft("");
  };

  const chipFg = tone === "azure" ? J.azureDeep : J.ink2;
  const chipBg = tone === "azure" ? J.azureSoft : J.surface2;
  const chipBd = tone === "azure" ? J.azureBorder : J.hairline;

  return (
    <Box>
      <JTextField
        id={id}
        label={label}
        helper={helper}
        value={draft}
        onChange={setDraft}
        placeholder={placeholder}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
        }}
        endIcon={
          <JButton variant="quiet" size="sm" onClick={commit} disabled={!draft.trim()}>
            {addLabel}
          </JButton>
        }
      />
      <Box
        sx={{
          mt: 1,
          display: "flex",
          flexWrap: "wrap",
          gap: 0.75,
          minHeight: 36,
          alignItems: "center",
        }}
      >
        {values.length === 0 ? (
          <Typography sx={TYPE.micro}>{emptyHint}</Typography>
        ) : (
          values.map((value, index) => (
            <Box
              key={`${value}-${index}`}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                pl: 1.25,
                pr: 0.5,
                height: 28,
                borderRadius: R.pill,
                border: `1px solid ${chipBd}`,
                bgcolor: chipBg,
                color: chipFg,
                maxWidth: "100%",
              }}
            >
              <Typography
                component="span"
                sx={{ ...TYPE.micro, color: chipFg, fontWeight: 700, minWidth: 0 }}
                title={value}
              >
                {value}
              </Typography>
              <Box
                component="button"
                type="button"
                aria-label={t("jobsV2.form.removeItem", "Remove {{item}}", { item: value })}
                onClick={() => onRemove(index)}
                sx={{
                  display: "inline-grid",
                  placeItems: "center",
                  width: 20,
                  height: 20,
                  p: 0,
                  border: "none",
                  cursor: "pointer",
                  borderRadius: R.pill,
                  bgcolor: "transparent",
                  color: "inherit",
                  "&:hover": { bgcolor: J.surface3 },
                  ...focusRing,
                }}
              >
                <IconWrapper icon="mdi:close" size={13} />
              </Box>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}

/** A two-column field grid at `lg+`, one column below it (spec 7.6). */
export function FieldGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
        gap: 2.5,
        alignItems: "start",
      }}
    >
      {children}
    </Box>
  );
}

export interface StepProps {
  form: JobFormApi;
  /** Field name -> the source that prefilled it, for the scraped-import provenance markers. */
  provenance?: Record<string, string>;
}

export function StepRole({ form, provenance }: StepProps) {
  const { t } = useTranslation("common");
  const { data, errors, showErrors, setField } = form;
  const err = (field: keyof typeof errors) => (showErrors ? (errors[field] ?? null) : null);
  const logoUrl = data.company_logo?.trim() ?? "";
  const logoValid = logoUrl.length > 0 && !form.logoBroken && !err("company_logo");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <SectionHeader
        icon="mdi:briefcase-outline"
        title={t("jobsV2.form.stepRole", "The role")}
        description={t(
          "jobsV2.form.stepRoleHint",
          "What the opening is, who it is with, and where it sits.",
        )}
      />
      <JCard>
        <RequiredLegend sx={{ mb: 2 }} />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <FieldGrid>
            <Box>
              <FieldProvenance source={provenance?.job_title} />
              <JTextField
                id="job-title"
                label={t("jobsV2.form.jobTitle", "Job title")}
                required
                value={data.job_title}
                onChange={(v) => setField("job_title", v)}
                error={err("job_title")}
                placeholder={t("jobsV2.form.jobTitlePlaceholder", "e.g. Software Engineer")}
              />
            </Box>
            <Box>
              <FieldProvenance source={provenance?.company_name} />
              <JTextField
                id="company-name"
                label={t("jobsV2.form.companyName", "Company name")}
                required
                value={data.company_name}
                onChange={(v) => setField("company_name", v)}
                error={err("company_name")}
                placeholder={t("jobsV2.form.companyNamePlaceholder", "e.g. Acme Inc.")}
              />
            </Box>
          </FieldGrid>

          <Box>
            <FieldProvenance source={provenance?.company_logo} />
            <JTextField
              id="company-logo"
              type="url"
              label={t("jobsV2.form.companyLogo", "Company logo URL")}
              value={data.company_logo ?? ""}
              onChange={(v) => setField("company_logo", v)}
              error={err("company_logo")}
              helper={t(
                "jobsV2.form.companyLogoHint",
                "Optional — we will use the company initial if you leave this empty.",
              )}
              placeholder="https://example.com/logo.png"
            />
            {logoUrl.length > 0 && (
              <Box
                sx={{
                  mt: 1.25,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: R.inner,
                  border: `1px solid ${form.logoBroken ? J.dangerBd : J.hairline}`,
                  bgcolor: form.logoBroken ? J.dangerBg : J.surface2,
                }}
              >
                {/* The preview's onError sets React state. The shipped version set
                    `style.display = "none"`, which left a dashed box captioned "Logo preview"
                    and no way to tell a broken URL from a slow one. */}
                <Box
                  component="img"
                  src={logoUrl}
                  alt=""
                  onError={() => form.setLogoBroken(true)}
                  onLoad={() => form.setLogoBroken(false)}
                  sx={{
                    width: 56,
                    height: 56,
                    flexShrink: 0,
                    objectFit: "contain",
                    p: 0.5,
                    borderRadius: R.ctl,
                    border: `1px solid ${J.hairline}`,
                    bgcolor: J.surface,
                    display: form.logoBroken ? "none" : "block",
                  }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ ...TYPE.label, mb: 0.25 }}>
                    {form.logoBroken
                      ? t("jobsV2.form.logoBroken", "That URL did not load an image")
                      : t("jobsV2.form.logoPreview", "Logo preview")}
                  </Typography>
                  <Typography sx={{ ...TYPE.micro, wordBreak: "break-all" }}>{logoUrl}</Typography>
                  {form.logoBroken && (
                    <JButton
                      variant="quiet"
                      size="sm"
                      startIcon="mdi:refresh"
                      onClick={() => form.setLogoBroken(false)}
                      sx={{ mt: 0.5, px: 0 }}
                    >
                      {t("jobsV2.form.retryLogo", "Retry")}
                    </JButton>
                  )}
                </Box>
                {logoValid && (
                  <Box sx={{ ml: "auto", flexShrink: 0 }}>
                    <CompanyLogo src={logoUrl} name={data.company_name} size={40} />
                  </Box>
                )}
              </Box>
            )}
          </Box>

          <FieldGrid>
            <Box>
              <FieldProvenance source={provenance?.location} />
              <JTextField
                id="location"
                label={t("jobsV2.form.location", "Location")}
                value={data.location ?? ""}
                onChange={(v) => setField("location", v)}
                placeholder={t("jobsV2.form.locationPlaceholder", "e.g. Bangalore, Remote")}
              />
            </Box>
            <Box>
              <FieldProvenance source={provenance?.apply_link} />
              <JTextField
                id="apply-link"
                type="url"
                label={t("jobsV2.form.applyLink", "External apply link")}
                value={data.apply_link ?? ""}
                onChange={(v) => setField("apply_link", v)}
                error={err("apply_link")}
                helper={t(
                  "jobsV2.form.applyLinkHint",
                  "Leave empty to take applications inside the portal.",
                )}
                placeholder="https://careers.example.com/apply"
              />
            </Box>
          </FieldGrid>

          <FieldGrid>
            <JSelect
              id="job-type"
              label={t("jobsV2.form.jobType", "Job type")}
              value={data.job_type ?? "job"}
              onChange={(v) => setField("job_type", v)}
              options={[
                { value: "job", label: t("jobsV2.form.jobTypeJob", "Job") },
                { value: "internship", label: t("jobsV2.form.jobTypeInternship", "Internship") },
              ]}
            />
            <Box>
              <FieldProvenance source={provenance?.employment_type} />
              <JSelect
                id="employment-type"
                label={t("jobsV2.form.employmentType", "Employment type")}
                value={data.employment_type ?? ""}
                onChange={(v) => setField("employment_type", v)}
                placeholder={t("jobsV2.form.notSet", "Not set")}
                options={[
                  { value: "", label: t("jobsV2.form.notSet", "Not set") },
                  { value: "Full-time", label: t("jobsV2.form.fullTime", "Full-time") },
                  { value: "Part-time", label: t("jobsV2.form.partTime", "Part-time") },
                  { value: "Internship", label: t("jobsV2.form.internship", "Internship") },
                  { value: "Contract", label: t("jobsV2.form.contract", "Contract") },
                ]}
              />
            </Box>
          </FieldGrid>

          <FieldGrid>
            <Box>
              <FieldProvenance source={provenance?.industry_type} />
              <JTextField
                id="industry-type"
                label={t("jobsV2.form.industry", "Industry")}
                value={data.industry_type ?? ""}
                onChange={(v) => setField("industry_type", v)}
                placeholder={t("jobsV2.form.industryPlaceholder", "e.g. Technology")}
              />
            </Box>
            <Box>
              <FieldProvenance source={provenance?.role_category} />
              <JTextField
                id="role-category"
                label={t("jobsV2.form.roleCategory", "Role category")}
                value={data.role_category ?? ""}
                onChange={(v) => setField("role_category", v)}
                placeholder={t("jobsV2.form.roleCategoryPlaceholder", "e.g. Software Development")}
              />
            </Box>
          </FieldGrid>

          <JTextField
            id="openings"
            label={t("jobsV2.form.openings", "Number of openings")}
            error={err("number_of_openings")}
            helper={t("jobsV2.form.openingsHint", "Whole number only, minimum 1.")}
            value={data.number_of_openings == null ? "" : String(data.number_of_openings)}
            onChange={form.setOpenings}
            inputMode="numeric"
            placeholder="5"
            sx={{ maxWidth: 260 }}
          />
        </Box>
      </JCard>
    </Box>
  );
}
