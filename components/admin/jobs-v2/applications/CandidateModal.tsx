"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { JobApplicationV2 } from "@/lib/services/jobs-v2.service";
import { formatDate } from "@/lib/jobs-v2/format";
import {
  J,
  JAvatar,
  JButton,
  JModal,
  JSelect,
  JTextArea,
  JTextField,
  R,
  StatusPill,
  StatusSelect,
  TYPE,
} from "@/components/jobs-v2/ui";
import {
  OFFERED_STAGE,
  PIPELINE_STAGES,
  PipelineRail,
  type PipelineField,
} from "./PipelineRail";

/** Exactly the keys the PATCH body has always carried. The shape is unchanged. */
export interface CandidateUpdates {
  status?: JobApplicationV2["status"];
  drive?: string;
  internal_shortlisting?: string;
  reason_not_shortlisted?: string;
  shortlisted_by_hr?: string;
  round_1?: string;
  round_2?: string;
  round_3?: string;
  round_4?: string;
  offered?: string;
}

export interface CandidateModalProps {
  open: boolean;
  app: JobApplicationV2 | null;
  onClose: () => void;
  onSave: (id: number, updates: CandidateUpdates) => Promise<void>;
  onOpenResume: (url: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  /** "3 of 41" — so triage does not feel like an unbounded stack of modals. */
  position?: { index: number; total: number };
}

/**
 * One candidate, one screen.
 *
 * Three shipped bugs die here:
 *   - **`dirty` guards the backdrop and Esc.** Seven Selects and two text fields no longer
 *     vanish with no warning because `onClose={() => setDetailApp(null)}` fired on a stray click.
 *   - **Opening the resume no longer closes the modal.** The parent stacks
 *     `ResumeUrlPreviewModal` over this one.
 *   - **Clearing "reason not shortlisted" works.** `?.trim() || undefined` dropped an empty
 *     string from the PATCH body, so the old reason persisted forever.
 */
export function CandidateModal({
  open,
  app,
  onClose,
  onSave,
  onOpenResume,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  position,
}: CandidateModalProps) {
  const { t } = useTranslation("common");

  const [draft, setDraft] = useState<JobApplicationV2 | null>(app);
  const [reasonTouched, setReasonTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Re-seed whenever a DIFFERENT candidate is opened (including via the prev/next arrows).
  useEffect(() => {
    setDraft(app);
    setReasonTouched(false);
    setSaveError(null);
  }, [app]);

  const setField = useCallback(
    (field: keyof JobApplicationV2, value: string) => {
      setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
    },
    [],
  );

  const dirty = useMemo(() => {
    if (!app || !draft) return false;
    const keys: (keyof JobApplicationV2)[] = [
      "status",
      "drive",
      "internal_shortlisting",
      "shortlisted_by_hr",
      "round_1",
      "round_2",
      "round_3",
      "round_4",
      "offered",
      "reason_not_shortlisted",
    ];
    return keys.some((key) => (app[key] ?? "") !== (draft[key] ?? ""));
  }, [app, draft]);

  const save = useCallback(async () => {
    if (!draft) return;
    setSaving(true);
    setSaveError(null);
    const reason = (draft.reason_not_shortlisted ?? "").trim();
    try {
      await onSave(draft.id, {
        status: draft.status,
        drive: draft.drive ?? "",
        internal_shortlisting: draft.internal_shortlisting ?? "",
        // Touched and now empty means CLEAR IT. Anything else keeps the shipped semantics.
        reason_not_shortlisted: reason ? reason : reasonTouched ? "" : undefined,
        shortlisted_by_hr: draft.shortlisted_by_hr ?? "",
        round_1: draft.round_1 ?? "",
        round_2: draft.round_2 ?? "",
        round_3: draft.round_3 ?? "",
        round_4: draft.round_4 ?? "",
        offered: draft.offered ?? "",
      });
      onClose();
    } catch (err) {
      setSaveError((err as Error)?.message ?? (t("jobsV2.error.body") as string));
    } finally {
      setSaving(false);
    }
  }, [draft, onClose, onSave, reasonTouched, t]);

  if (!draft) {
    return null;
  }

  const info: Array<{ key: string; label: string; value: string | number | null | undefined }> = [
    { key: "phone", label: t("jobsV2.candidate.phone", "Phone"), value: draft.student_phone },
    { key: "college", label: t("jobsV2.candidate.college", "College"), value: draft.student_college },
    { key: "degree", label: t("jobsV2.candidate.degree", "Degree"), value: draft.student_degree },
    {
      key: "batch",
      label: t("jobsV2.candidate.batch", "Batch / passout year"),
      value: draft.student_yop ?? draft.student_batch,
    },
    {
      key: "location",
      label: t("jobsV2.candidate.location", "Location"),
      value: draft.student_location,
    },
  ];

  return (
    <JModal
      open={open}
      onClose={onClose}
      dirty={dirty && !saving}
      size="lg"
      mobile="fullscreen"
      icon="mdi:account-outline"
      eyebrow={
        position
          ? (t("jobsV2.candidate.position", "Candidate {{index}} of {{total}}", {
              index: position.index,
              total: position.total,
            }) as string)
          : (t("jobsV2.candidate.eyebrow", "Candidate") as string)
      }
      title={draft.student_name || draft.student_email}
      description={draft.student_email}
      footer={
        <>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <JButton variant="ghost" onClick={onClose} disabled={saving}>
              {t("jobsV2.modal.cancel")}
            </JButton>
            {/* Triage is prev/next, not close-scroll-open-repeat. */}
            <JButton
              variant="ghost"
              startIcon="mdi:chevron-left"
              onClick={onPrev}
              disabled={!hasPrev || saving}
              disabledReason={
                hasPrev
                  ? undefined
                  : (t("jobsV2.candidate.noPrev", "This is the first candidate on the page") as string)
              }
            >
              {t("jobsV2.candidate.previous", "Previous")}
            </JButton>
            <JButton
              variant="ghost"
              endIcon="mdi:chevron-right"
              onClick={onNext}
              disabled={!hasNext || saving}
              disabledReason={
                hasNext
                  ? undefined
                  : (t("jobsV2.candidate.noNext", "This is the last candidate on the page") as string)
              }
            >
              {t("jobsV2.candidate.next", "Next")}
            </JButton>
          </Box>
          <JButton
            variant="primary"
            startIcon="mdi:content-save-outline"
            onClick={() => void save()}
            loading={saving}
            disabled={!dirty}
            disabledReason={
              dirty ? undefined : (t("jobsV2.candidate.noChanges", "Nothing has changed yet") as string)
            }
          >
            {t("jobsV2.stepper.save")}
          </JButton>
        </>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <JAvatar
            src={draft.student_profile_pic_url ?? undefined}
            name={draft.student_name || draft.student_email}
            size={56}
          />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={TYPE.h3}>{draft.student_name || "—"}</Typography>
            <Typography sx={TYPE.mono}>{draft.student_email}</Typography>
            <Box sx={{ display: "flex", gap: 0.75, mt: 0.75, flexWrap: "wrap" }}>
              <StatusPill kind="application" value={draft.status} />
              <Typography sx={{ ...TYPE.micro, alignSelf: "center" }}>
                {t("jobsV2.candidate.appliedAt", "Applied {{date}}", {
                  date: formatDate(draft.applied_at, { withTime: true }),
                })}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <JButton
              variant="secondary"
              size="sm"
              startIcon="mdi:account-box-outline"
              href={`/admin/profile/${draft.student}`}
            >
              {t("jobsV2.candidate.viewProfile", "Profile")}
            </JButton>
            <JButton
              variant="secondary"
              size="sm"
              startIcon="mdi:file-document-outline"
              onClick={() => draft.resume_url && onOpenResume(draft.resume_url)}
              disabled={!draft.resume_url}
              disabledReason={
                draft.resume_url
                  ? undefined
                  : (t("jobsV2.candidate.noResume", "This candidate attached no resume") as string)
              }
            >
              {t("jobsV2.candidate.resume", "Resume")}
            </JButton>
          </Box>
        </Box>

        <Section title={t("jobsV2.candidate.statusSection", "Application status")}>
          <StatusSelect
            id="candidate-status"
            kind="application"
            label={t("jobsV2.candidate.status", "Status")}
            value={draft.status}
            onChange={(value) => setField("status", value)}
            sx={{ maxWidth: 280 }}
          />
        </Section>

        <Section title={t("jobsV2.candidate.info", "Candidate information")}>
          <Box
            component="dl"
            sx={{
              m: 0,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 1.5,
            }}
          >
            {info.map((row) => (
              <Box key={row.key}>
                <Typography component="dt" sx={TYPE.label}>
                  {row.label}
                </Typography>
                <Typography component="dd" sx={{ ...TYPE.bodyStrong, m: 0, mt: 0.25 }}>
                  {row.value === undefined || row.value === null || row.value === ""
                    ? "—"
                    : String(row.value)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Section>

        {(draft.student_skills || draft.student_experience) && (
          <Section title={t("jobsV2.candidate.background", "Skills and experience")}>
            {draft.student_skills && (
              <Box sx={{ mb: draft.student_experience ? 1.5 : 0 }}>
                <Typography sx={{ ...TYPE.label, mb: 0.25 }}>
                  {t("jobsV2.form.skills", "Skills")}
                </Typography>
                <Typography sx={TYPE.body}>{draft.student_skills}</Typography>
              </Box>
            )}
            {draft.student_experience && (
              <Box>
                <Typography sx={{ ...TYPE.label, mb: 0.25 }}>
                  {t("jobsV2.form.experience", "Experience")}
                </Typography>
                <Typography sx={TYPE.body}>{draft.student_experience}</Typography>
              </Box>
            )}
          </Section>
        )}

        <Section title={t("jobsV2.candidate.pipeline", "Pipeline")}>
          <Box sx={{ mb: 2 }}>
            <PipelineRail app={draft} />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <JTextField
              id="candidate-drive"
              label={t("jobsV2.pipeline.drive", "Drive")}
              value={draft.drive ?? ""}
              onChange={(value) => setField("drive", value)}
              placeholder={t("jobsV2.pipeline.drivePlaceholder", "Name of the hiring drive")}
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              {[...PIPELINE_STAGES, OFFERED_STAGE].map((stage) => (
                <JSelect
                  key={stage.field}
                  id={`candidate-${stage.field}`}
                  label={t(stage.labelKey, stage.fallback)}
                  value={(draft[stage.field as PipelineField] as string) ?? ""}
                  onChange={(value) => setField(stage.field as keyof JobApplicationV2, value)}
                  placeholder="—"
                  options={stage.options.map((option) => ({
                    value: option.value,
                    label: option.value === "" ? "—" : option.label,
                  }))}
                />
              ))}
            </Box>
          </Box>
        </Section>

        <Section title={t("jobsV2.candidate.reasonSection", "Outcome")}>
          <JTextArea
            id="candidate-reason"
            label={t("jobsV2.candidate.reason", "Reason not shortlisted")}
            value={draft.reason_not_shortlisted ?? ""}
            onChange={(value) => {
              setReasonTouched(true);
              setField("reason_not_shortlisted", value);
            }}
            rows={3}
            helper={t(
              "jobsV2.candidate.reasonHint",
              "The learner sees this on their application page. Clearing it here removes it there.",
            )}
          />
        </Section>

        {saveError && (
          <Typography role="alert" sx={{ ...TYPE.small, color: J.dangerFg }}>
            {saveError}
          </Typography>
        )}

        <Typography sx={TYPE.micro}>
          {t("jobsV2.candidate.reference", "Application reference")}{" "}
          <Box component="span" sx={TYPE.mono}>
            #{draft.id}
          </Box>
          {" · "}
          <Box
            component={NextLink}
            href={`/admin/profile/${draft.student}`}
            sx={{ color: J.azure, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
          >
            {t("jobsV2.candidate.openProfile", "Open the full profile")}
          </Box>
        </Typography>
      </Box>
    </JModal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: R.card,
        border: `1px solid ${J.hairline}`,
        bgcolor: J.surface2,
      }}
    >
      <Typography sx={{ ...TYPE.label, mb: 1.25 }}>{title}</Typography>
      {children}
    </Box>
  );
}
