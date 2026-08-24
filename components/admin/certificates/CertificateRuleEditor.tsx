"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { LoadingButton } from "@/components/common/LoadingButton";
import { useToast } from "@/components/common/Toast";
import { adminCertificatesService } from "@/lib/services/certificates.service";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";
import type {
  CertificateRule,
  CertificateRuleCriterion,
  CertificateRuleScope,
  CertificateRulesBulkPayload,
  CertificateTemplate,
} from "@/lib/certificates/types";
import { TemplatePickerField } from "./TemplatePickerField";
import type { TemplatePreviewContext } from "./previewPayload";

/**
 * "When this much of this course/assessment is done, award this design."
 *
 * One editor for both modules, because the shape of the decision is identical
 * even though the two screens around it look nothing alike: a criterion, the
 * percent it fires at, and the design it awards.
 *
 * TWO THINGS ABOUT THIS COMPONENT ARE LOAD-BEARING.
 *
 * 1. PUT /rules/ is a bulk REPLACE for one scope+object, not a patch. Whatever
 *    array is sent becomes the object's complete rule set, so anything the
 *    editor loaded but does not display must still be sent back or saving here
 *    silently deletes rules configured somewhere else. That is what `carried`
 *    below is for, and it is the reason there is exactly ONE writer of a given
 *    course's or assessment's rules on any screen.
 *
 * 2. Pinned rows do not own their percent. A course's completion threshold is
 *    the course's `min_completion_percent` and an assessment's bands are its
 *    pass-band fields; those already exist as form fields the admin edits
 *    elsewhere on the same screen. Storing a second copy here would let the two
 *    drift, and the learner would be gated on whichever one the backend happens
 *    to read. So a pinned row reads its threshold from props, every render.
 */

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

export interface PinnedRuleSpec {
  criterion: CertificateRuleCriterion;
  /** Row heading, e.g. "Course completion" or "Excellence band". */
  label: string;
  hint?: string;
  /**
   * The percent this row fires at, owned by the caller's own form field.
   * Null when that field is blank or not yet valid, which blocks saving the
   * row rather than saving a rule with no threshold.
   */
  threshold: number | null;
}

interface CustomRow {
  /** Stable across renders so React does not remount a row when one above it
   *  is deleted, which would blur the field the admin is typing into. */
  key: string;
  id?: number;
  criterion: CertificateRuleCriterion;
  /** Held as a string while editing: a number state snaps "" to 0 and the
   *  admin watches their empty field fill itself with a threshold of zero. */
  threshold: string;
  templateId: number | null;
}

export interface CertificateRuleEditorProps {
  clientId: string | number;
  scope: CertificateRuleScope;
  /** Required when scope is "course". */
  courseId?: number | null;
  /** Required when scope is "assessment". */
  assessmentId?: number | null;
  /** Rows that always exist, in order, with thresholds owned by the caller. */
  pinned?: PinnedRuleSpec[];
  /** Let the admin add further bands of their own. */
  allowCustomRows?: boolean;
  templates: CertificateTemplate[];
  templatesLoading?: boolean;
  /** Context for the design miniatures, so they show the real course title. */
  previewContext?: TemplatePreviewContext;
  disabled?: boolean;
  /** Shown instead of the editor when the object has no id yet (create flow). */
  unavailableMessage?: string;
  saveLabel?: string;
  /** Fires on hydrate and on every design change, so a parent can drive a live
   *  preview without owning the editor's state. */
  onTemplateChange?: (criterion: CertificateRuleCriterion, templateId: number | null) => void;
  onSaved?: (rules: CertificateRule[]) => void;
  /** Drops the heading block, for embedding inside an existing settings card. */
  dense?: boolean;
  title?: string;
  description?: string;
}

const CRITERION_OPTIONS: Array<{
  value: CertificateRuleCriterion;
  key: string;
  fallback: string;
}> = [
  { value: "completion", key: "certificatesUpload.ruleCriterionCompletion", fallback: "Completion" },
  {
    value: "participation",
    key: "certificatesUpload.ruleCriterionParticipation",
    fallback: "Participation",
  },
  {
    value: "excellence",
    key: "certificatesUpload.ruleCriterionExcellence",
    fallback: "Excellence",
  },
];

let rowSeq = 0;
const nextRowKey = () => `rule-${(rowSeq += 1)}`;

function parsePercent(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

/* ------------------------------------------------------------------ *
 * The editor
 * ------------------------------------------------------------------ */

export function CertificateRuleEditor({
  clientId,
  scope,
  courseId = null,
  assessmentId = null,
  pinned = [],
  allowCustomRows = false,
  templates,
  templatesLoading = false,
  previewContext,
  disabled = false,
  unavailableMessage,
  saveLabel,
  onTemplateChange,
  onSaved,
  dense = false,
  title,
  description,
}: CertificateRuleEditorProps) {
  const theme = useTheme();
  const { t } = useTranslation("common");
  const { showToast } = useToast();

  const objectId = scope === "course" ? courseId : assessmentId;
  const ready = typeof objectId === "number" && Number.isFinite(objectId);

  /** Which load has finished. `loading` is derived from it rather than being
   *  its own flag, so nothing here calls setState synchronously inside the
   *  effect - that is a cascading render on mount and React's own lint rule
   *  rejects it. */
  const [settledKey, setSettledKey] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pinnedTemplates, setPinnedTemplates] = useState<Record<string, number | null>>({});
  const [pinnedIds, setPinnedIds] = useState<Record<string, number | undefined>>({});
  /** A pinned row is only written when a rule already exists for it or the
   *  admin has actually chosen a design. Otherwise an admin who merely opened
   *  the screen would create rules by pressing Save. */
  const [pinnedConfigured, setPinnedConfigured] = useState<Record<string, boolean>>({});
  const [customRows, setCustomRows] = useState<CustomRow[]>([]);
  /** Rules that exist on the server but this editor does not show. See (1) in
   *  the file header: they must be sent back or the bulk PUT deletes them. */
  const [carried, setCarried] = useState<CertificateRule[]>([]);
  const [baseline, setBaseline] = useState<string>("");

  // Kept in a ref so hydrating and changing a design can notify the parent
  // without the callback identity dragging the load effect into a re-fetch loop.
  const notifyRef = useRef(onTemplateChange);
  notifyRef.current = onTemplateChange;

  // The criteria STRING is the dependency, never the `pinned` array itself:
  // callers build that array inline every render (its thresholds come from live
  // form fields), so depending on its identity would refetch the rules on every
  // keypress and stomp whatever the admin was in the middle of choosing.
  const pinnedKey = pinned.map((p) => p.criterion).join("|");
  const pinnedCriteria = useMemo(
    () => (pinnedKey ? (pinnedKey.split("|") as CertificateRuleCriterion[]) : []),
    [pinnedKey],
  );

  const serialise = useCallback(
    (
      pinnedT: Record<string, number | null>,
      configured: Record<string, boolean>,
      rows: CustomRow[],
    ) =>
      JSON.stringify({
        pinned: pinnedCriteria.map((c) => [c, configured[c] ? pinnedT[c] ?? null : "off"]),
        rows: rows.map((r) => [r.criterion, r.threshold.trim(), r.templateId]),
      }),
    [pinnedCriteria],
  );

  const loadKey = `${clientId}|${scope}|${objectId}|${pinnedKey}|${allowCustomRows}`;
  const loading = ready && settledKey !== loadKey;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const query =
      scope === "course"
        ? { scope, course_id: objectId as number }
        : { scope, assessment_id: objectId as number };

    void adminCertificatesService
      .getRules(clientId, query)
      .then((rules) => {
        if (cancelled) return;
        const criteria = pinnedKey ? pinnedKey.split("|") : [];
        const nextTemplates: Record<string, number | null> = {};
        const nextIds: Record<string, number | undefined> = {};
        const nextConfigured: Record<string, boolean> = {};
        const claimed = new Set<number>();

        for (const criterion of criteria) {
          const match = rules.find((r) => r.criterion === criterion && !claimed.has(r.id));
          if (match) claimed.add(match.id);
          nextTemplates[criterion] = match?.template_id ?? null;
          nextIds[criterion] = match?.id;
          nextConfigured[criterion] = Boolean(match);
        }

        const leftovers = rules.filter((r) => !claimed.has(r.id));
        const rows: CustomRow[] = allowCustomRows
          ? leftovers.map((r) => ({
              key: nextRowKey(),
              id: r.id,
              criterion: r.criterion,
              threshold: r.threshold == null ? "" : String(r.threshold),
              templateId: r.template_id ?? null,
            }))
          : [];

        setPinnedTemplates(nextTemplates);
        setPinnedIds(nextIds);
        setPinnedConfigured(nextConfigured);
        setCustomRows(rows);
        setCarried(allowCustomRows ? [] : leftovers);
        setBaseline(serialise(nextTemplates, nextConfigured, rows));
        setLoadFailed(false);
        for (const criterion of criteria) {
          notifyRef.current?.(
            criterion as CertificateRuleCriterion,
            nextTemplates[criterion] ?? null,
          );
        }
      })
      .catch(() => {
        if (cancelled) return;
        // Fail visibly rather than showing an empty rule set: an editor that
        // looks like "no rules configured" invites an admin to save it, and a
        // bulk PUT of an empty array would then wipe rules that do exist.
        setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setSettledKey(loadKey);
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, scope, objectId, ready, pinnedKey, allowCustomRows, serialise, loadKey]);

  /* ---- Validation ---- */

  const validation = useMemo(() => {
    const errors: Record<string, string> = {};
    const seen = new Map<number, string>();

    const flagDuplicate = (key: string, value: number) => {
      const first = seen.get(value);
      if (first) {
        errors[key] = t(
          "certificatesUpload.ruleDuplicateThreshold",
          "Another band already awards at this percent.",
        );
        return;
      }
      seen.set(value, key);
    };

    for (const spec of pinned) {
      if (!pinnedConfigured[spec.criterion]) continue;
      if (spec.threshold == null || !Number.isFinite(spec.threshold)) {
        errors[spec.criterion] = t(
          "certificatesUpload.ruleThresholdMissing",
          "Set this band's percent before choosing a design.",
        );
        continue;
      }
      if (spec.threshold < 0 || spec.threshold > 100) {
        errors[spec.criterion] = t(
          "certificatesUpload.ruleThresholdRange",
          "Enter a percent between 0 and 100.",
        );
        continue;
      }
      flagDuplicate(spec.criterion, spec.threshold);
    }

    for (const row of customRows) {
      const value = parsePercent(row.threshold);
      if (value == null) {
        errors[row.key] = t(
          "certificatesUpload.ruleThresholdRequired",
          "Enter the percent this band awards at.",
        );
        continue;
      }
      if (value < 0 || value > 100) {
        errors[row.key] = t(
          "certificatesUpload.ruleThresholdRange",
          "Enter a percent between 0 and 100.",
        );
        continue;
      }
      flagDuplicate(row.key, value);
    }

    return { errors, valid: Object.keys(errors).length === 0 };
  }, [customRows, pinned, pinnedConfigured, t]);

  const dirty =
    !loading &&
    !loadFailed &&
    baseline !== "" &&
    serialise(pinnedTemplates, pinnedConfigured, customRows) !== baseline;

  /* ---- Mutations ---- */

  const setPinnedTemplate = (criterion: CertificateRuleCriterion, templateId: number | null) => {
    setPinnedTemplates((prev) => ({ ...prev, [criterion]: templateId }));
    setPinnedConfigured((prev) => ({ ...prev, [criterion]: true }));
    notifyRef.current?.(criterion, templateId);
  };

  const addRow = () => {
    setCustomRows((prev) => [
      ...prev,
      { key: nextRowKey(), criterion: "excellence", threshold: "", templateId: null },
    ]);
  };

  const updateRow = (key: string, patch: Partial<CustomRow>) => {
    setCustomRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const removeRow = (key: string) => {
    setCustomRows((prev) => prev.filter((r) => r.key !== key));
  };

  const handleSave = async () => {
    if (!ready || !validation.valid) return;
    setSaving(true);
    try {
      const rules: CertificateRulesBulkPayload["rules"] = [];

      for (const spec of pinned) {
        if (!pinnedConfigured[spec.criterion]) continue;
        rules.push({
          id: pinnedIds[spec.criterion],
          criterion: spec.criterion,
          threshold: spec.threshold,
          template_id: pinnedTemplates[spec.criterion] ?? null,
        });
      }

      for (const row of customRows) {
        rules.push({
          id: row.id,
          criterion: row.criterion,
          threshold: parsePercent(row.threshold),
          template_id: row.templateId,
        });
      }

      // See (1) in the file header: rules this editor never displayed still
      // have to travel, or the replace deletes them.
      for (const rule of carried) {
        rules.push({
          id: rule.id,
          criterion: rule.criterion,
          threshold: rule.threshold,
          template_id: rule.template_id,
        });
      }

      const payload: CertificateRulesBulkPayload = {
        scope,
        course_id: scope === "course" ? (objectId as number) : null,
        assessment_id: scope === "assessment" ? (objectId as number) : null,
        rules,
      };

      const saved = await adminCertificatesService.putRules(clientId, payload);

      // Re-key from the response so a row created just now picks up its server
      // id: without that, the next save posts it again as a new rule.
      const claimed = new Set<number>();
      const nextIds: Record<string, number | undefined> = {};
      for (const spec of pinned) {
        const match = saved.find((r) => r.criterion === spec.criterion && !claimed.has(r.id));
        if (match) claimed.add(match.id);
        nextIds[spec.criterion] = match?.id;
      }
      setPinnedIds(nextIds);
      if (allowCustomRows) {
        const leftovers = saved.filter((r) => !claimed.has(r.id));
        setCustomRows((prev) =>
          prev.map((row, index) => ({ ...row, id: leftovers[index]?.id ?? row.id })),
        );
      }
      setBaseline(serialise(pinnedTemplates, pinnedConfigured, customRows));
      showToast(
        t("certificatesUpload.ruleSaved", "Certificate rules saved."),
        "success",
      );
      onSaved?.(saved);
    } catch (e) {
      showToast(
        getAxiosErrorDetail(
          e,
          t("certificatesUpload.ruleSaveError", "Could not save the certificate rules."),
        ),
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  /* ---- Render ---- */

  if (!ready) {
    return (
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        {unavailableMessage ??
          t(
            "certificatesUpload.ruleUnavailable",
            "Save this first, then reopen it to choose a certificate design.",
          )}
      </Alert>
    );
  }

  if (loadFailed) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        {t(
          "certificatesUpload.ruleLoadError",
          "Could not load the certificate rules. Reload the page before editing them, so nothing already configured is overwritten.",
        )}
      </Alert>
    );
  }

  const rowSurfaceSx = {
    p: 1.75,
    borderRadius: 3,
    bgcolor: alpha(theme.palette.text.primary, 0.02),
    border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
  } as const;

  return (
    <Box>
      {!dense && (title || description) ? (
        <Box sx={{ mb: 1.75 }}>
          {title ? (
            <Typography sx={{ fontWeight: 800, fontSize: "0.98rem" }}>{title}</Typography>
          ) : null}
          {description ? (
            <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", mt: 0.25 }}>
              {description}
            </Typography>
          ) : null}
        </Box>
      ) : null}

      <Stack spacing={1.75}>
        {pinned.map((spec) => (
          <Box key={spec.criterion} sx={rowSurfaceSx}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
              sx={{ mb: 1.25 }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800, fontSize: "0.9rem" }}>
                  {spec.label}
                </Typography>
                {spec.hint ? (
                  <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                    {spec.hint}
                  </Typography>
                ) : null}
              </Box>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  color: "text.secondary",
                  flexShrink: 0,
                }}
              >
                {spec.threshold == null
                  ? t("certificatesUpload.ruleThresholdUnset", "Percent not set")
                  : t("certificatesUpload.ruleAwardsAt", "Awards at {{percent}}%", {
                      percent: spec.threshold,
                    })}
              </Typography>
            </Stack>

            <TemplatePickerField
              templates={templates}
              loading={templatesLoading || loading}
              value={pinnedTemplates[spec.criterion] ?? null}
              onChange={(id) => setPinnedTemplate(spec.criterion, id)}
              previewContext={previewContext}
              disabled={disabled}
            />

            {validation.errors[spec.criterion] ? (
              <Typography sx={{ mt: 0.75, fontSize: "0.78rem", color: "error.main" }}>
                {validation.errors[spec.criterion]}
              </Typography>
            ) : null}
          </Box>
        ))}

        {allowCustomRows
          ? customRows.map((row) => (
              <Box key={row.key} sx={rowSurfaceSx}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  alignItems={{ xs: "stretch", sm: "flex-start" }}
                  sx={{ mb: 1.25 }}
                >
                  <TextField
                    select
                    size="small"
                    label={t("certificatesUpload.ruleCriterion", "Criterion")}
                    value={row.criterion}
                    onChange={(e) =>
                      updateRow(row.key, {
                        criterion: e.target.value as CertificateRuleCriterion,
                      })
                    }
                    disabled={disabled}
                    sx={{ minWidth: 180 }}
                  >
                    {CRITERION_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {t(opt.key, opt.fallback)}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    size="small"
                    type="number"
                    label={t("certificatesUpload.ruleThreshold", "Awards at (%)")}
                    value={row.threshold}
                    onChange={(e) => updateRow(row.key, { threshold: e.target.value })}
                    inputProps={{ min: 0, max: 100 }}
                    error={Boolean(validation.errors[row.key])}
                    helperText={validation.errors[row.key] ?? " "}
                    disabled={disabled}
                    sx={{ width: { xs: "100%", sm: 170 } }}
                  />

                  <Box sx={{ flex: 1 }} />

                  <IconButton
                    onClick={() => removeRow(row.key)}
                    disabled={disabled}
                    aria-label={t("certificatesUpload.ruleRemove", "Remove this band")}
                    sx={{ alignSelf: { xs: "flex-end", sm: "center" } }}
                  >
                    <IconWrapper icon="mdi:trash-can-outline" size={18} />
                  </IconButton>
                </Stack>

                <TemplatePickerField
                  templates={templates}
                  loading={templatesLoading || loading}
                  value={row.templateId}
                  onChange={(id) => updateRow(row.key, { templateId: id })}
                  previewContext={previewContext}
                  disabled={disabled}
                />
              </Box>
            ))
          : null}
      </Stack>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.25}
        alignItems={{ xs: "stretch", sm: "center" }}
        sx={{ mt: 2 }}
      >
        {allowCustomRows ? (
          <Button
            variant="outlined"
            onClick={addRow}
            disabled={disabled || loading}
            startIcon={<IconWrapper icon="mdi:plus" size={16} />}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
          >
            {t("certificatesUpload.ruleAdd", "Add a band")}
          </Button>
        ) : null}

        <LoadingButton
          variant="contained"
          onClick={() => void handleSave()}
          loading={saving}
          disabled={disabled || loading || !dirty || !validation.valid}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 2.5 }}
        >
          {saveLabel ?? t("certificatesUpload.ruleSave", "Save certificate rules")}
        </LoadingButton>

        {dirty && validation.valid ? (
          <Typography sx={{ fontSize: "0.78rem", color: "warning.main", fontWeight: 700 }}>
            {t("certificatesUpload.ruleUnsaved", "Unsaved changes")}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}
