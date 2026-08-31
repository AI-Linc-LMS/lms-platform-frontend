"use client";

import { useMemo, useState } from "react";
import { Autocomplete, Box, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  J,
  JButton,
  JDatePicker,
  JField,
  JModal,
  JSelect,
  MicroRuleList,
  R,
  TYPE,
  controlSx,
} from "@/components/jobs-v2/ui";
import { APP_STATUS, APP_STATUS_ORDER } from "@/lib/jobs-v2/status";
import { formatCount } from "@/lib/jobs-v2/format";
import { adminJobsV2Service } from "@/lib/services/admin/admin-jobs-v2.service";
import type { JobV2 } from "@/lib/services/jobs-v2.service";

/**
 * The export endpoint accepts `job_id` and `status` and nothing else (spec 10.5 — the services
 * are read-only for this work). The date range is therefore rendered, disabled, with the reason
 * stated: **the UI does not pretend to a filter the CSV will not honour.** Flip this the day the
 * endpoint grows the params.
 */
const SUPPORTS_DATE_RANGE = false;

export interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  jobs: JobV2[];
  /** Prefills the job picker from `?job_id=` — the existing deep link. */
  defaultJobId?: string;
  /**
   * Estimated rows for the current scope. `null` when the applicant totals are still loading,
   * so the modal can say "still counting" rather than quote a number that is about to change.
   */
  estimateRows: (jobId: string, status: string) => number | null;
}

export function ExportModal({
  open,
  onClose,
  jobs,
  defaultJobId = "",
  estimateRows,
}: ExportModalProps) {
  const { t } = useTranslation("common");
  const [jobId, setJobId] = useState(defaultJobId);
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const options = useMemo(
    () => jobs.map((job) => ({ id: String(job.id), label: job.job_title, job })),
    [jobs],
  );
  const selectedOption = options.find((option) => option.id === jobId) ?? null;

  const estimate = estimateRows(jobId, status);

  const statusOptions = useMemo(
    () => APP_STATUS_ORDER.map((value) => ({
      value,
      label: t(APP_STATUS[value].labelKey) as string,
      icon: APP_STATUS[value].icon,
      tone: APP_STATUS[value].fg,
    })),
    [t],
  );

  const scopeLines = [
    jobId && selectedOption
      ? `${t("jobsV2.reports.export.scopeJob", "One job") as string}: ${selectedOption.label}`
      : (t("jobsV2.reports.export.scopeAllJobs", "Every job in this workspace") as string),
    status
      ? `${t("jobsV2.reports.export.scopeStatus", "Only") as string}: ${
          statusOptions.find((option) => option.value === status)?.label ?? status
        }`
      : (t("jobsV2.reports.export.scopeAllStatuses", "Every application status") as string),
    estimate === null
      ? (t(
          "jobsV2.reports.export.estimatePending",
          "Row count is still being counted — the CSV itself is always complete.",
        ) as string)
      : (t("jobsV2.reports.export.estimate", "About {{n}} rows", {
          n: formatCount(estimate),
        }) as string),
  ];

  const handleExport = async () => {
    setExporting(true);
    setResult(null);
    try {
      await adminJobsV2Service.downloadExportReport({
        job_id: jobId ? Number(jobId) : undefined,
        status: status || undefined,
      });
      setResult({
        ok: true,
        message: t(
          "jobsV2.reports.export.done",
          "The CSV has been downloaded to your browser's downloads folder.",
        ) as string,
      });
    } catch (err) {
      setResult({
        ok: false,
        message:
          (err as Error)?.message ??
          (t("jobsV2.reports.export.failed", "The export did not finish.") as string),
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <JModal
      open={open}
      onClose={onClose}
      mobile="fullscreen"
      size="md"
      icon="mdi:file-download-outline"
      eyebrow={t("jobsV2.reports.export.eyebrow", "EXPORT") as string}
      title={t("jobsV2.reports.export.title", "Export applications as CSV") as string}
      description={
        t(
          "jobsV2.reports.export.description",
          "Choose what the file should cover. You will see exactly how much it contains before you download it.",
        ) as string
      }
      footer={
        <>
          <JButton variant="ghost" onClick={onClose} disabled={exporting}>
            {t("jobsV2.modal.cancel")}
          </JButton>
          <JButton
            variant="primary"
            startIcon="mdi:download"
            loading={exporting}
            onClick={handleExport}
          >
            {t("jobsV2.reports.export.cta", "Export CSV")}
          </JButton>
        </>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <JField
          label={t("jobsV2.reports.export.job", "Job") as string}
          htmlFor="export-job"
          helper={
            t(
              "jobsV2.reports.export.jobHelper",
              "Leave empty to export every job. Type to search a long list.",
            ) as string
          }
        >
          {/* A searchable Autocomplete, not a flat 200-item Select rendering "{title} - {company}". */}
          <Autocomplete
            id="export-job"
            options={options}
            value={selectedOption}
            onChange={(_, next) => setJobId(next?.id ?? "")}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderOption={(props, option) => {
              const { key, ...rest } = props as React.HTMLAttributes<HTMLLIElement> & {
                key: string;
              };
              return (
                <Box component="li" key={key} {...rest} sx={{ display: "block !important" }}>
                  <Typography sx={TYPE.bodyStrong}>{option.label}</Typography>
                  <Typography sx={TYPE.micro}>{option.job.company_name}</Typography>
                </Box>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={t("jobsV2.reports.export.allJobs", "All jobs") as string}
                variant="standard"
                InputProps={{
                  ...params.InputProps,
                  disableUnderline: true,
                  sx: controlSx({}),
                }}
              />
            )}
            slotProps={{
              paper: {
                sx: {
                  borderRadius: R.inner,
                  border: `1px solid ${J.hairline}`,
                  bgcolor: J.surface,
                  backgroundImage: "none",
                },
              },
            }}
          />
        </JField>

        <JSelect
          label={t("jobsV2.reports.export.status", "Application status") as string}
          value={status}
          onChange={setStatus}
          options={statusOptions}
          placeholder={t("jobsV2.reports.export.allStatuses", "All statuses") as string}
        />

        <Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <JDatePicker
              label={t("jobsV2.reports.export.from", "Applied from") as string}
              value={from}
              onChange={setFrom}
              disabled={!SUPPORTS_DATE_RANGE}
            />
            <JDatePicker
              label={t("jobsV2.reports.export.to", "Applied until") as string}
              value={to}
              onChange={setTo}
              disabled={!SUPPORTS_DATE_RANGE}
            />
          </Box>
          {!SUPPORTS_DATE_RANGE && (
            <Typography sx={{ ...TYPE.small, mt: 1 }}>
              {t(
                "jobsV2.reports.export.noDateRange",
                "The export endpoint does not accept a date range yet, so the CSV covers every date. Filter in your spreadsheet for now.",
              )}
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            p: 1.75,
            borderRadius: R.inner,
            border: `1px solid ${J.hairline}`,
            bgcolor: J.surface2,
          }}
        >
          <Typography sx={{ ...TYPE.label, mb: 1 }}>
            {t("jobsV2.reports.export.preview", "What this file will contain")}
          </Typography>
          <MicroRuleList items={scopeLines} />
          <Typography sx={{ ...TYPE.micro, mt: 1.25 }}>
            {t(
              "jobsV2.reports.export.columnsNote",
              "The server decides the columns: one row per application, with the learner, the job and every pipeline field recorded on it.",
            )}
          </Typography>
        </Box>

        {result && (
          <Box
            role="status"
            sx={{
              p: 1.5,
              borderRadius: R.inner,
              border: `1px solid ${result.ok ? J.successBd : J.dangerBd}`,
              bgcolor: result.ok ? J.successBg : J.dangerBg,
              color: result.ok ? J.successFg : J.dangerFg,
            }}
          >
            <Typography sx={{ ...TYPE.bodyStrong, color: "inherit" }}>{result.message}</Typography>
          </Box>
        )}
      </Box>
    </JModal>
  );
}
