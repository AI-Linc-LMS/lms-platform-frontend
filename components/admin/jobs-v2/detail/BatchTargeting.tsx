"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Checkbox, IconButton, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { J, JButton, JConfirm, JModal, R, SearchInput, TYPE } from "@/components/jobs-v2/ui";
import {
  adminJobsV2Service,
  type JobCohortRow,
} from "@/lib/services/admin/admin-jobs-v2.service";

/* ==========================================================================
 * Post a job to batches, from the job.
 *
 * Requested as "there is an option to add students to a job but no option to add a cohort". The
 * binding already narrowed a job's audience everywhere a job is read; it just could not be made
 * from here.
 *
 * The one thing an admin must not be surprised by: a job with no targeting is visible to EVERY
 * student, and posting it to a batch narrows it to that batch. So the picker says so before the
 * first batch is added, and removing the last batch says the job opens back up.
 * ======================================================================== */

export interface BatchTargetingProps {
  jobId: number;
  posted: Array<{ id: number; name: string }>;
  /** True when courses, colleges or named students already narrow the job. */
  otherwiseTargeted: boolean;
  published: boolean;
  onChange: (posted: Array<{ id: number; name: string }>) => void;
}

export function BatchTargeting({ jobId, posted, otherwiseTargeted, published, onChange }: BatchTargetingProps) {
  const { t } = useTranslation("common");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [removing, setRemoving] = useState<{ id: number; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeOpensToEveryone = !otherwiseTargeted && posted.length === 1;

  const confirmRemove = async () => {
    if (!removing) return;
    setBusy(true);
    setError(null);
    try {
      const next = await adminJobsV2Service.updateJobCohorts(jobId, [removing.id], "remove");
      onChange(next.posted.map(({ id, name }) => ({ id, name })));
      setRemoving(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 0.75 }}>
        <Typography sx={TYPE.label}>{t("jobsV2.audience.batches", "Batches")}</Typography>
        <JButton
          variant="secondary"
          size="sm"
          startIcon="mdi:account-group-outline"
          onClick={() => setPickerOpen(true)}
          data-testid="post-to-batches"
        >
          {t("jobsV2.audience.postToBatches", "Post to batches")}
        </JButton>
      </Box>

      {posted.length === 0 ? (
        <Typography sx={TYPE.micro}>{t("jobsV2.audience.noBatches", "Not posted to any batch")}</Typography>
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }} data-testid="posted-batches">
          {posted.map((batch) => (
            <Box
              key={batch.id}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.25,
                pl: 1,
                pr: 0.25,
                py: 0.25,
                borderRadius: R.ctl,
                border: `1px solid ${J.hairline}`,
                bgcolor: J.surface2,
                minWidth: 0,
              }}
            >
              <Typography sx={{ ...TYPE.micro, color: J.ink, fontWeight: 700 }} noWrap>
                {batch.name}
              </Typography>
              <IconButton
                size="small"
                aria-label={t("jobsV2.audience.removeBatch", "Take this job off {{name}}", { name: batch.name }) as string}
                onClick={() => setRemoving(batch)}
              >
                <IconWrapper icon="mdi:close" size={14} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
      {error && !removing ? (
        <Typography role="alert" sx={{ ...TYPE.micro, color: J.dangerFg, mt: 0.75 }}>
          {error}
        </Typography>
      ) : null}

      <BatchPicker
        open={pickerOpen}
        jobId={jobId}
        narrowsFromEveryone={!otherwiseTargeted && posted.length === 0}
        published={published}
        onClose={() => setPickerOpen(false)}
        onSaved={(next) => {
          onChange(next.map(({ id, name }) => ({ id, name })));
          setPickerOpen(false);
        }}
      />

      <JConfirm
        open={Boolean(removing)}
        title={t("jobsV2.audience.removeBatchTitle", "Take this job off {{name}}?", { name: removing?.name ?? "" })}
        body={error ?? undefined}
        consequences={[
          removeOpensToEveryone
            ? t(
                "jobsV2.audience.removeLastBatch",
                "Nothing else narrows this job, so it becomes visible to every student again.",
              )
            : t(
                "jobsV2.audience.removeBatchEffect",
                "Members of this batch stop seeing it, unless a course, college or assignment still includes them.",
              ),
        ]}
        confirmLabel={t("jobsV2.audience.removeBatchConfirm", "Take it off")}
        tone={removeOpensToEveryone ? "danger" : "neutral"}
        busy={busy}
        onConfirm={confirmRemove}
        onCancel={() => {
          setRemoving(null);
          setError(null);
        }}
      />
    </Box>
  );
}

function BatchPicker({
  open,
  jobId,
  narrowsFromEveryone,
  published,
  onClose,
  onSaved,
}: {
  open: boolean;
  jobId: number;
  narrowsFromEveryone: boolean;
  published: boolean;
  onClose: () => void;
  onSaved: (posted: JobCohortRow[]) => void;
}) {
  const { t } = useTranslation("common");
  const [available, setAvailable] = useState<JobCohortRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Set<number>>(new Set());
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setAvailable(null);
    setLoadError(null);
    setSaveError(null);
    setChosen(new Set());
    setQuery("");
    adminJobsV2Service
      .getJobCohorts(jobId)
      .then((data) => {
        if (!cancelled) setAvailable(data.available);
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [open, jobId]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (available ?? []).filter((b) => !q || b.name.toLowerCase().includes(q));
  }, [available, query]);

  const reach = useMemo(
    () => (available ?? []).filter((b) => chosen.has(b.id)).reduce((sum, b) => sum + b.member_count, 0),
    [available, chosen],
  );

  const toggle = (id: number) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const next = await adminJobsV2Service.updateJobCohorts(jobId, [...chosen], "add");
      onSaved(next.posted);
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <JModal
      open={open}
      onClose={onClose}
      title={t("jobsV2.audience.postToBatches", "Post to batches")}
      description={t(
        "jobsV2.audience.postToBatchesHelp",
        "Every active member of the batches you pick will see this job.",
      )}
      icon="mdi:account-group-outline"
      size="md"
      dirty={chosen.size > 0}
      footer={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%", flexWrap: "wrap" }}>
          <Typography sx={{ ...TYPE.micro, flex: 1, minWidth: 0 }}>
            {chosen.size === 0
              ? t("jobsV2.audience.pickBatches", "Pick one or more batches")
              : t("jobsV2.audience.batchReach", "{{count}} batch(es), {{members}} student(s)", {
                  count: chosen.size,
                  members: reach,
                })}
          </Typography>
          <JButton variant="ghost" onClick={onClose}>
            {t("common.cancel", "Cancel")}
          </JButton>
          <JButton
            variant="primary"
            disabled={chosen.size === 0}
            loading={saving}
            onClick={save}
            data-testid="confirm-post-to-batches"
          >
            {t("jobsV2.audience.postConfirm", "Post job")}
          </JButton>
        </Box>
      }
    >
      {narrowsFromEveryone && (
        <Box
          role="note"
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: R.ctl,
            border: `1px solid ${J.warnBd}`,
            bgcolor: J.warnBg,
          }}
        >
          <Typography sx={{ ...TYPE.small, color: J.warnFg }}>
            {t(
              "jobsV2.audience.narrowWarning",
              "This job is visible to every student right now. Posting it to a batch limits it to that batch's members, plus any courses, colleges or students you add.",
            )}
          </Typography>
        </Box>
      )}
      {published && (
        <Typography sx={{ ...TYPE.micro, mb: 1.5 }}>
          {t("jobsV2.audience.batchNotify", "Members of a newly added batch get an in-app notification.")}
        </Typography>
      )}

      {loadError ? (
        <Typography role="alert" sx={{ ...TYPE.small, color: J.dangerFg }}>
          {loadError}
        </Typography>
      ) : available === null ? (
        <Typography sx={TYPE.small}>{t("common.loading", "Loading...")}</Typography>
      ) : available.length === 0 ? (
        <Typography sx={TYPE.small}>
          {t("jobsV2.audience.noBatchesLeft", "There are no other open batches in this account.")}
        </Typography>
      ) : (
        <>
          {available.length > 8 && (
            <Box sx={{ mb: 1.5 }}>
              <SearchInput
                value={query}
                onChange={setQuery}
                onSubmit={setQuery}
                placeholder={t("jobsV2.audience.searchBatches", "Search batches") as string}
                ariaLabel={t("jobsV2.audience.searchBatches", "Search batches") as string}
              />
            </Box>
          )}
          <Box
            component="ul"
            sx={{ listStyle: "none", m: 0, p: 0, maxHeight: 360, overflowY: "auto" }}
            data-testid="batch-options"
          >
            {shown.map((batch) => (
              <Box
                component="li"
                key={batch.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  py: 0.5,
                  borderBottom: `1px solid ${J.hairline}`,
                  minWidth: 0,
                }}
              >
                <Checkbox
                  size="small"
                  checked={chosen.has(batch.id)}
                  onChange={() => toggle(batch.id)}
                  inputProps={{ "aria-label": batch.name }}
                />
                <Box sx={{ minWidth: 0, flex: 1, cursor: "pointer" }} onClick={() => toggle(batch.id)}>
                  <Typography sx={{ ...TYPE.bodyStrong }} noWrap>
                    {batch.name}
                  </Typography>
                  <Typography sx={TYPE.micro}>
                    {t("jobsV2.audience.batchMembers", "{{count}} student(s)", { count: batch.member_count })}
                    {batch.status !== "active" ? ` · ${batch.status}` : ""}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </>
      )}
      {saveError && (
        <Typography role="alert" sx={{ ...TYPE.small, color: J.dangerFg, mt: 1.5 }}>
          {saveError}
        </Typography>
      )}
    </JModal>
  );
}
