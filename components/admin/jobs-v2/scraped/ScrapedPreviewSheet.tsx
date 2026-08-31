"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  CompanyLogo,
  ErrorState,
  J,
  JButton,
  JSheet,
  MetaRow,
  MicroRuleList,
  R,
  SkillChip,
  StatusPill,
  TYPE,
  relevanceColor,
  type MetaItem,
} from "@/components/jobs-v2/ui";
import { FormSkeleton } from "@/components/jobs-v2/ui";
import { formatExperience, formatLocation, formatSalary, relativeTime } from "@/lib/jobs-v2/format";
import { useSeq } from "@/lib/jobs-v2/useSeq";
import {
  adminScrapedJobsService,
  type ScrapedJob,
  type ScrapedJobDetail,
} from "@/lib/services/admin/admin-scraped-jobs.service";
import { config } from "@/lib/config";
import { SOURCE_KIND_LABELS, scrapedStateOf } from "./ScrapedTable";

export interface ScrapedPreviewSheetProps {
  /** The row that was opened. `null` closes the sheet. */
  row: ScrapedJob | null;
  onClose: () => void;
  onImportDraft: (row: ScrapedJob) => void;
  onReviewAndImport: (row: ScrapedJob) => void;
  /** True while the single-row import request for THIS row is in flight. */
  importing?: boolean;
}

/**
 * Read a scraped posting without leaving the app.
 *
 * Today the only way to read a posting before deciding is to open the employer's site in
 * another tab — so the triage decision is either made blind, or made somewhere else. The sheet
 * carries the description, the skills, the source and the scorer's reasoning, and its footer
 * holds the same three decisions the kebab does.
 */
export function ScrapedPreviewSheet({
  row,
  onClose,
  onImportDraft,
  onReviewAndImport,
  importing,
}: ScrapedPreviewSheetProps) {
  const { t } = useTranslation("common");
  const [detail, setDetail] = useState<ScrapedJobDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const seq = useSeq();
  const rowId = row?.id ?? null;

  const load = useCallback(async () => {
    if (rowId === null) return;
    const token = seq.next();
    setLoading(true);
    setLoadError(null);
    try {
      const data = await adminScrapedJobsService.getScrapedJob(rowId, config.clientId);
      if (!seq.isCurrent(token)) return;
      setDetail(data);
    } catch (err) {
      if (!seq.isCurrent(token)) return;
      // Never fall back to an empty body: an unreachable detail endpoint is an error, not a
      // posting with no description.
      setLoadError((err as Error)?.message ?? (t("jobsV2.error.body") as string));
    } finally {
      if (seq.isCurrent(token)) setLoading(false);
    }
  }, [rowId, seq, t]);

  useEffect(() => {
    if (rowId === null) {
      setDetail(null);
      setLoadError(null);
      return;
    }
    setDetail(null);
    load();
  }, [rowId, load]);

  if (!row) return null;

  const source = SOURCE_KIND_LABELS[row.source_kind] ?? row.source_kind;
  const meta: MetaItem[] = [
    { key: "location", icon: "mdi:map-marker-outline", label: formatLocation(row.location) ?? "" },
    { key: "jobType", icon: "mdi:briefcase-outline", label: row.job_type ?? "" },
    {
      key: "experience",
      icon: "mdi:chart-timeline-variant",
      label: formatExperience(row.years_of_experience) ?? "",
    },
    { key: "salary", icon: "mdi:cash-multiple", label: formatSalary(row.salary) ?? "" },
    {
      key: "posted",
      icon: "mdi:clock-outline",
      label: relativeTime(row.last_seen_at)
        ? (t("jobsV2.scraped.seenAt", "Seen {{when}}", {
            when: relativeTime(row.last_seen_at),
          }) as string)
        : "",
    },
  ].filter((item) => Boolean(item.label));

  const skills = Array.from(
    new Set([...(row.mandatory_skills ?? []), ...(row.key_skills ?? [])].map((s) => s.trim())),
  ).filter(Boolean);

  const description = detail?.job_description?.trim();
  const classification = [
    { key: "department", label: t("jobsV2.scraped.department", "Department"), value: row.department },
    { key: "industry", label: t("jobsV2.scraped.industry", "Industry"), value: row.industry_type },
    { key: "role", label: t("jobsV2.scraped.roleCategory", "Role category"), value: row.role_category },
    { key: "education", label: t("jobsV2.scraped.education", "Education"), value: row.education },
  ].filter((entry) => Boolean(entry.value?.trim()));

  return (
    <JSheet
      open
      onClose={onClose}
      size="lg"
      eyebrow={t("jobsV2.scraped.previewEyebrow", "SCRAPED POSTING") as string}
      title={row.job_title}
      description={[row.company_name, row.location].filter(Boolean).join(" · ")}
      footer={
        <>
          <JButton
            variant="secondary"
            startIcon="mdi:open-in-new"
            href={row.apply_url ?? undefined}
            external
            disabled={!row.apply_url}
            disabledReason={
              row.apply_url
                ? undefined
                : (t(
                    "jobsV2.scraped.noOriginal",
                    "The scraper did not record a link for this posting.",
                  ) as string)
            }
          >
            {t("jobsV2.scraped.openOriginal", "Open original")}
          </JButton>
          <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap" }}>
            <JButton
              variant="secondary"
              startIcon="mdi:briefcase-plus-outline"
              loading={importing}
              onClick={() => onImportDraft(row)}
            >
              {t("jobsV2.scraped.importDraft", "Import as draft")}
            </JButton>
            <JButton
              variant="primary"
              startIcon="mdi:arrow-right"
              onClick={() => onReviewAndImport(row)}
            >
              {t("jobsV2.scraped.reviewImport", "Review & import")}
            </JButton>
          </Box>
        </>
      }
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <CompanyLogo src={row.company_logo} name={row.company_name} size={48} />
        <Box sx={{ minWidth: 0, display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
          <StatusPill kind="scraped" value={scrapedStateOf(row)} />
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              px: 1,
              minHeight: 24,
              borderRadius: R.pill,
              border: `1px solid ${J.azureBorder}`,
              bgcolor: J.azureSoft,
              color: J.azureDeep,
              fontSize: "0.6875rem",
              fontWeight: 700,
            }}
          >
            {source}
          </Box>
        </Box>
      </Box>

      {meta.length > 0 && <MetaRow items={meta} sx={{ mb: 2 }} />}

      {row.relevance != null && (
        <Box
          sx={{
            mb: 2.5,
            p: 1.5,
            borderRadius: R.inner,
            border: `1px solid ${J.hairline}`,
            bgcolor: J.surface2,
          }}
        >
          <Typography sx={{ ...TYPE.label, mb: 0.5 }}>
            {t("jobsV2.scraped.relevanceHeading", "Why the scorer ranked this")}
          </Typography>
          <Typography
            sx={{ ...TYPE.numSm, color: relevanceColor(row.relevance), mb: 0.5 }}
          >
            {Math.round(row.relevance * 100)}%
          </Typography>
          <Typography sx={TYPE.body}>
            {row.relevance_reason?.trim() ||
              (t("jobsV2.scraped.noReason", "No reason recorded by the scorer.") as string)}
          </Typography>
        </Box>
      )}

      {skills.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ ...TYPE.label, mb: 1 }}>
            {t("jobsV2.scraped.col.skills", "Skills")}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {skills.map((skill) => (
              <SkillChip key={skill}>{skill}</SkillChip>
            ))}
          </Box>
        </Box>
      )}

      {classification.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ ...TYPE.label, mb: 1 }}>
            {t("jobsV2.scraped.classification", "Classification")}
          </Typography>
          <MicroRuleList
            items={classification.map((entry) => `${entry.label}: ${entry.value}`)}
          />
        </Box>
      )}

      <Typography sx={{ ...TYPE.label, mb: 1 }}>
        {t("jobsV2.scraped.descriptionHeading", "Description")}
      </Typography>
      {loading ? (
        <FormSkeleton sections={1} fields={3} />
      ) : loadError ? (
        <ErrorState
          variant="inline"
          title={t("jobsV2.scraped.detailErrorTitle", "We could not load the description") as string}
          body={
            t(
              "jobsV2.scraped.detailErrorBody",
              "The rest of this posting is still shown above.",
            ) as string
          }
          error={loadError}
          onRetry={load}
        />
      ) : description ? (
        <Typography sx={{ ...TYPE.prose, whiteSpace: "pre-wrap" }}>{description}</Typography>
      ) : (
        <Typography sx={{ ...TYPE.body, color: J.ink3 }}>
          {row.description_preview?.trim() ||
            (t(
              "jobsV2.scraped.noDescription",
              "The scraper did not capture a description for this posting.",
            ) as string)}
        </Typography>
      )}

      {detail?.company_info?.trim() && (
        <Box sx={{ mt: 2.5 }}>
          <Typography sx={{ ...TYPE.label, mb: 1 }}>
            {t("jobsV2.scraped.aboutCompany", "About the company")}
          </Typography>
          <Typography sx={{ ...TYPE.prose, whiteSpace: "pre-wrap" }}>
            {detail.company_info}
          </Typography>
        </Box>
      )}
    </JSheet>
  );
}
