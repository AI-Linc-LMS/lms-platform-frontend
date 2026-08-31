"use client";

import { useMemo, useState } from "react";
import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  BulkActionBar,
  J,
  JSelect,
  TYPE,
  type BulkAction,
  type BulkOutcome,
} from "@/components/jobs-v2/ui";
import { JOB_STATUS, JOB_STATUS_ORDER, VISIBILITY } from "@/lib/jobs-v2/status";
import { formatCount } from "@/lib/jobs-v2/format";
import { adminJobsV2Service } from "@/lib/services/admin/admin-jobs-v2.service";
import { config } from "@/lib/config";
import type { JobV2 } from "@/lib/services/jobs-v2.service";

type BulkJobStatus = NonNullable<JobV2["status"]>;

export interface JobsBulkActionsProps {
  selectedIds: number[];
  /** The rows currently on screen, so a failure can be named rather than reported as an id. */
  rows: JobV2[];
  onClear: () => void;
  /** Reconcile the list after a bulk write. Called once, after the request settles. */
  onDone: (changed: number[], patch: Partial<JobV2>) => void;
}

/**
 * The jobs list's bulk bar.
 *
 * **Two named actions, one request each** — status and visibility — instead of one handler
 * firing two sequential requests behind a single "Apply to Selected" button. That split is what
 * kills the partial-write-reported-as-total-failure bug: each action reports its own outcome,
 * and the bar's summary names what failed and offers "Retry failed".
 *
 * The two `render` entries are the pickers (the `BulkAction.render` slot exists for exactly
 * this); they carry no confirm of their own because they run nothing. The two button entries
 * appear once a target value is chosen, and each one states its consequences before it runs.
 */
export function JobsBulkActions({ selectedIds, rows, onClear, onDone }: JobsBulkActionsProps) {
  const { t } = useTranslation("common");
  const [targetStatus, setTargetStatus] = useState<string>("");
  const [targetVisibility, setTargetVisibility] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const count = selectedIds.length;

  const titleFor = (id: number) =>
    rows.find((r) => r.id === id)?.job_title ?? `#${id}`;

  const noop = async (): Promise<BulkOutcome> => ({ ok: 0, failed: [] });
  const noConfirm = { title: "", consequences: [] as string[] };

  const statusChoices = useMemo(
    () =>
      JOB_STATUS_ORDER.map((value) => ({
        value,
        label: t(JOB_STATUS[value].labelKey) as string,
        icon: JOB_STATUS[value].icon,
        tone: JOB_STATUS[value].fg,
      })),
    [t],
  );

  const actions = useMemo<BulkAction[]>(() => {
    const list: BulkAction[] = [
      {
        key: "status-picker",
        label: t("jobsV2.admin.bulk.statusPicker", "Set status to") as string,
        icon: "mdi:label-outline",
        onRun: noop,
        confirm: noConfirm,
        render: (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <Box component="span" sx={{ ...TYPE.small, whiteSpace: "nowrap", color: J.azureDeep }}>
              {t("jobsV2.admin.bulk.statusPicker", "Set status to")}
            </Box>
            <JSelect
              value={targetStatus}
              onChange={setTargetStatus}
              disabled={busy}
              options={statusChoices}
              placeholder={t("jobsV2.admin.bulk.choose", "Choose…") as string}
              aria-label={t("jobsV2.admin.bulk.statusPicker", "Set status to") as string}
              sx={{ minWidth: 168 }}
              fullWidth={false}
            />
          </Box>
        ),
      },
    ];

    if (targetStatus) {
      const statusLabel = t(
        (JOB_STATUS[targetStatus as keyof typeof JOB_STATUS] ?? JOB_STATUS.active).labelKey,
      ) as string;
      list.push({
        key: "status-apply",
        label: t("jobsV2.admin.bulk.applyStatus", "Change status") as string,
        icon: "mdi:check",
        confirm: {
          title: t("jobsV2.admin.bulk.confirmStatusTitle", "Change status on {{n}} jobs?", {
            n: formatCount(count),
          }) as string,
          consequences: [
            t("jobsV2.bulk.consequenceStatus", {
              count: formatCount(count),
              status: statusLabel,
            }) as string,
            t(
              "jobsV2.admin.bulk.consequenceStatusStudent",
              "Students already looking at these jobs see the new status immediately.",
            ) as string,
          ],
        },
        onRun: async (failedIds) => {
          const ids = (failedIds as number[] | undefined) ?? selectedIds;
          setBusy(true);
          try {
            await adminJobsV2Service.bulkUpdateJobStatus(
              ids,
              targetStatus as BulkJobStatus,
              config.clientId,
            );
            onDone(ids, { status: targetStatus as BulkJobStatus });
            return { ok: ids.length, failed: [] };
          } catch (err) {
            const reason =
              (err as Error)?.message ??
              (t("jobsV2.bulk.unknownError") as string);
            return {
              ok: 0,
              failed: ids.map((id) => ({ id, title: titleFor(id), reason })),
            };
          } finally {
            setBusy(false);
          }
        },
      });
    }

    list.push({
      key: "visibility-picker",
      label: t("jobsV2.admin.bulk.visibilityPicker", "Set visibility to") as string,
      icon: "mdi:eye-outline",
      onRun: noop,
      confirm: noConfirm,
      render: (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          <Box component="span" sx={{ ...TYPE.small, whiteSpace: "nowrap", color: J.azureDeep }}>
            {t("jobsV2.admin.bulk.visibilityPicker", "Set visibility to")}
          </Box>
          <JSelect
            value={targetVisibility}
            onChange={setTargetVisibility}
            disabled={busy}
            options={[
              { value: "published", label: t(VISIBILITY.published.labelKey) as string },
              { value: "draft", label: t(VISIBILITY.draft.labelKey) as string },
            ]}
            aria-label={t("jobsV2.admin.bulk.visibilityPicker", "Set visibility to") as string}
            sx={{ minWidth: 150 }}
            fullWidth={false}
          />
        </Box>
      ),
    });

    if (targetVisibility) {
      const publish = targetVisibility === "published";
      list.push({
        key: "visibility-apply",
        label: t("jobsV2.admin.bulk.applyVisibility", "Change visibility") as string,
        icon: "mdi:check",
        confirm: {
          title: t(
            "jobsV2.admin.bulk.confirmVisibilityTitle",
            "Change visibility on {{n}} jobs?",
            { n: formatCount(count) },
          ) as string,
          consequences: [
            publish
              ? (t("jobsV2.bulk.consequenceVisible", { count: formatCount(count) }) as string)
              : (t("jobsV2.bulk.consequenceHidden", { count: formatCount(count) }) as string),
            publish
              ? (t(
                  "jobsV2.admin.bulk.consequencePublishTargeting",
                  "Only students matched by each job's targeting see it.",
                ) as string)
              : (t(
                  "jobsV2.admin.bulk.consequenceUnpublishApplications",
                  "Applications already submitted are kept and stay visible to you.",
                ) as string),
          ],
        },
        onRun: async (failedIds) => {
          const ids = (failedIds as number[] | undefined) ?? selectedIds;
          setBusy(true);
          try {
            await adminJobsV2Service.bulkUpdateJobVisibility(ids, publish, config.clientId);
            onDone(ids, { is_published: publish });
            return { ok: ids.length, failed: [] };
          } catch (err) {
            const reason =
              (err as Error)?.message ??
              (t("jobsV2.bulk.unknownError") as string);
            return {
              ok: 0,
              failed: ids.map((id) => ({ id, title: titleFor(id), reason })),
            };
          } finally {
            setBusy(false);
          }
        },
      });
    }

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, count, onDone, rows, selectedIds, statusChoices, t, targetStatus, targetVisibility]);

  return (
    <BulkActionBar
      count={count}
      noun={t("jobsV2.noun.job", { count }) as string}
      onClear={() => {
        setTargetStatus("");
        setTargetVisibility("");
        onClear();
      }}
      actions={actions}
      busy={busy}
    />
  );
}
