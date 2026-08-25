"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
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
  CertificateRuleItemWrite,
  CertificateRuleScope,
  CertificateRulesBulkPayload,
  CertificateTemplate,
} from "@/lib/certificates/types";
import { TemplatePickerField } from "./TemplatePickerField";
import type { TemplatePreviewContext } from "./previewPayload";
import { NoticeStrip } from "./shared";

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
  /**
   * The band's NAME, free text, stored as the rule's `label`. Not one of three
   * hard-coded English words: an institution can call a band "With Honours",
   * and the backend column has always been free text.
   */
  label: string;
  /** Held as a string while editing: a number state snaps "" to 0 and the
   *  admin watches their empty field fill itself with a threshold of zero. */
  threshold: string;
  templateId: number | null;
}

export interface CertificateRuleEditorProps {
  clientId: string | number;
  scope: CertificateRuleScope;
  /** Required when scope is "adaptive_course". */
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

let rowSeq = 0;
const nextRowKey = () => `rule-${(rowSeq += 1)}`;

/**
 * The rule endpoint returns validation errors in TWO shapes under one key.
 *
 * Per-row field errors arrive as an ARRAY of objects, one per row
 * (`{"rules": [{}, {"template_id": ["This field is required."]}]}`), while
 * view-level errors arrive as a bare STRING
 * (`{"rules": "Template 99999 does not belong to this client."}`). Reading
 * either one naively prints "[object Object]" at the admin, which tells them
 * nothing about which band is wrong.
 */
function readRuleError(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: Record<string, unknown> } })?.response?.data;
  const rules = data?.rules;

  if (typeof rules === "string" && rules.trim()) return rules.trim();

  if (Array.isArray(rules)) {
    const messages: string[] = [];
    rules.forEach((entry, index) => {
      if (!entry || typeof entry !== "object") return;
      for (const [field, value] of Object.entries(entry as Record<string, unknown>)) {
        const text = Array.isArray(value) ? value.join(" ") : String(value);
        if (text.trim()) messages.push(`Band ${index + 1} (${field}): ${text.trim()}`);
      }
    });
    if (messages.length) return messages.join(" ");
  }

  // scope / course_id / assessment_id are reported as plain field errors.
  for (const key of ["scope", "course_id", "assessment_id"]) {
    const value = data?.[key];
    if (Array.isArray(value) && value[0]) return String(value[0]);
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return getAxiosErrorDetail(error, fallback);
}

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
  const { t } = useTranslation("common");
  const { showToast } = useToast();

  const objectId = scope === "adaptive_course" ? courseId : assessmentId;
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

  // The pinned rows' floors, in a ref for the same reason `notifyRef` is one:
  // callers rebuild the `pinned` array inline on every render (its thresholds
  // come from live form fields), so depending on its identity would refetch the
  // rules on every keypress. The load effect needs the CURRENT floors to match
  // server rows against.
  const pinnedFloorsRef = useRef<Record<string, number | null>>({});
  pinnedFloorsRef.current = Object.fromEntries(
    pinned.map((spec) => [spec.criterion, spec.threshold]),
  );

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
        rows: rows.map((r) => [r.id ?? null, r.label.trim(), r.threshold.trim(), r.templateId]),
      }),
    [pinnedCriteria],
  );

  const loadKey = `${clientId}|${scope}|${objectId}|${pinnedKey}|${allowCustomRows}`;
  const loading = ready && settledKey !== loadKey;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const query =
      scope === "adaptive_course"
        ? { scope, course_id: objectId as number }
        : { scope, assessment_id: objectId as number };

    void adminCertificatesService
      .getRules(clientId, query)
      .then((rules) => {
        if (cancelled) return;
        // Pinned rows are matched to server rows by their FLOOR, never by a
        // "criterion" string: the backend has no such column (a rule is
        // {label, min_percent, template_id}), and keying on one meant every
        // reload re-keyed to undefined and the next save posted every row
        // again as new. `min_percent` is the identity a band actually has -
        // the bulk validator refuses two active bands sharing one - and the
        // server `id` is what carries that identity forward once saved.
        const criteria = pinnedKey ? pinnedKey.split("|") : [];
        const nextTemplates: Record<string, number | null> = {};
        const nextIds: Record<string, number | undefined> = {};
        const nextConfigured: Record<string, boolean> = {};
        const claimed = new Set<number>();
        const floors = pinnedFloorsRef.current;

        for (const criterion of criteria) {
          const floor = floors[criterion];
          const match =
            floor == null
              ? undefined
              : rules.find((r) => !claimed.has(r.id) && Number(r.min_percent) === floor);
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
              label: r.label ?? "",
              threshold: String(r.min_percent ?? ""),
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
      // `template_id` is required and non-nullable on the wire: a rule with no
      // template awards nothing, so it would sit in the admin looking
      // configured while quietly issuing nothing. Block the row here with copy
      // that says what to do, rather than letting one unpicked design 400 the
      // whole replace and take every valid row down with it.
      if (pinnedTemplates[spec.criterion] == null) {
        errors[spec.criterion] = t(
          "certificatesUpload.ruleTemplateMissing",
          "Pick a design for this band.",
        );
        continue;
      }
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
      if (row.templateId == null) {
        errors[row.key] = t(
          "certificatesUpload.ruleTemplateMissing",
          "Pick a design for this band.",
        );
        continue;
      }
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
  }, [customRows, pinned, pinnedConfigured, pinnedTemplates, t]);

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
      { key: nextRowKey(), label: "", threshold: "", templateId: null },
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
      const rules: CertificateRuleItemWrite[] = [];

      /**
       * The wire shape is `{id?, label?, min_percent?, template_id, order?,
       * is_active?}` and nothing else. It used to be sent as `criterion` and
       * `threshold`, neither of which the serializer declares: being a plain
       * `Serializer` it dropped both and returned 200, so every band came back
       * nameless with `min_percent` defaulted to 0 - and since `matching_rule`
       * takes the first match by descending floor, a "90% distinction" band
       * sitting at 0.00 was awarded to the learner who scraped 41%.
       */
      for (const spec of pinned) {
        if (!pinnedConfigured[spec.criterion]) continue;
        const templateId = pinnedTemplates[spec.criterion];
        if (templateId == null || spec.threshold == null) continue;
        rules.push({
          id: pinnedIds[spec.criterion],
          label: spec.label,
          min_percent: spec.threshold,
          template_id: templateId,
          order: rules.length,
        });
      }

      for (const row of customRows) {
        const min = parsePercent(row.threshold);
        if (row.templateId == null || min == null) continue;
        rules.push({
          id: row.id,
          label: row.label.trim(),
          min_percent: min,
          template_id: row.templateId,
          order: rules.length,
        });
      }

      // See (1) in the file header: rules this editor never displayed still
      // have to travel, or the replace deletes them.
      for (const rule of carried) {
        rules.push({
          id: rule.id,
          label: rule.label,
          min_percent: Number(rule.min_percent),
          template_id: rule.template_id,
          order: rules.length,
          is_active: rule.is_active,
        });
      }

      // The sibling id is OMITTED, not sent as null: the backend rejects
      // `assessment_id` being present at all when scope is adaptive_course, and
      // vice versa, because such a row would mean "award a course's certificate
      // for an assessment result".
      const payload: CertificateRulesBulkPayload =
        scope === "adaptive_course"
          ? { scope, course_id: objectId as number, rules }
          : { scope, assessment_id: objectId as number, rules };

      const response = await adminCertificatesService.putRules(clientId, payload);
      const saved = response.rules;

      // Re-key from the response so a row created just now picks up its server
      // id: without that, the next save posts it again as a new rule. Matched
      // on the FLOOR, which is the identity a band has - two active bands may
      // never share one, so this is unambiguous.
      const claimed = new Set<number>();
      const nextIds: Record<string, number | undefined> = {};
      for (const spec of pinned) {
        const match =
          spec.threshold == null
            ? undefined
            : saved.find(
                (r) => !claimed.has(r.id) && Number(r.min_percent) === spec.threshold,
              );
        if (match) claimed.add(match.id);
        nextIds[spec.criterion] = match?.id;
      }
      setPinnedIds(nextIds);
      if (allowCustomRows) {
        const leftovers = saved.filter((r) => !claimed.has(r.id));
        setCustomRows((prev) =>
          prev.map((row) => {
            const min = parsePercent(row.threshold);
            const match =
              min == null ? undefined : leftovers.find((r) => Number(r.min_percent) === min);
            return { ...row, id: match?.id ?? row.id };
          }),
        );
      }
      setBaseline(serialise(pinnedTemplates, pinnedConfigured, customRows));
      showToast(
        response.removed > 0
          ? t(
              "certificatesUpload.ruleSavedRemoved",
              "Certificate rules saved. {{count}} band(s) were removed.",
              { count: response.removed },
            )
          : t("certificatesUpload.ruleSaved", "Certificate rules saved."),
        "success",
      );
      onSaved?.(saved);
    } catch (e) {
      showToast(
        readRuleError(
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
      <NoticeStrip tone="violet">
        {unavailableMessage ??
          t(
            "certificatesUpload.ruleUnavailable",
            "Save this first, then reopen it to choose a certificate design.",
          )}
      </NoticeStrip>
    );
  }

  if (loadFailed) {
    return (
      <NoticeStrip tone="danger">
        {t(
          "certificatesUpload.ruleLoadError",
          "Could not load the certificate rules. Reload the page before editing them, so nothing already configured is overwritten.",
        )}
      </NoticeStrip>
    );
  }

  /** A band row. Radius 2.5 sits one step inside whichever card hosts this
   *  editor, on both screens, instead of matching or exceeding it. */
  const rowSurfaceSx = {
    p: 1.75,
    borderRadius: 2.5,
    bgcolor: "var(--card-bg)",
    border: "1px solid var(--border-default)",
  } as const;

  return (
    <Box>
      {!dense && (title || description) ? (
        <Box sx={{ mb: 1.75 }}>
          {title ? (
            <Typography
              sx={{ fontWeight: 800, fontSize: "0.95rem", lineHeight: 1.2, color: "var(--font-primary)" }}
            >
              {title}
            </Typography>
          ) : null}
          {description ? (
            <Typography sx={{ fontSize: "0.72rem", color: "var(--font-secondary)", mt: "1px" }}>
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
                <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--font-primary)" }}>
                  {spec.label}
                </Typography>
                {spec.hint ? (
                  <Typography sx={{ fontSize: "0.76rem", color: "var(--font-secondary)", lineHeight: 1.5 }}>
                    {spec.hint}
                  </Typography>
                ) : null}
              </Box>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: "0.78rem",
                  fontFamily: "var(--font-mono)",
                  color: "var(--font-secondary)",
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

            {/* `allowDefault={false}`: `template_id` is required and
                non-nullable on a rule, so "the default branded certificate" is
                not a choice this field can offer. Offering it would be a
                selection that cannot be saved. */}
            <TemplatePickerField
              templates={templates}
              loading={templatesLoading || loading}
              value={pinnedTemplates[spec.criterion] ?? null}
              onChange={(id) => setPinnedTemplate(spec.criterion, id)}
              previewContext={previewContext}
              disabled={disabled}
              allowDefault={false}
            />

            {validation.errors[spec.criterion] ? (
              <Typography sx={{ mt: 0.75, fontSize: "0.78rem", fontWeight: 600, color: "#b91c1c" }}>
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
                  {/* Free text, because that is what the column is. A dropdown
                      of three English words here was writing a field the API
                      does not have, and an institution that awards "With
                      Honours" could not say so. */}
                  <TextField
                    size="small"
                    label={t("certificatesUpload.ruleBandName", "Band name")}
                    placeholder={t("certificatesUpload.ruleBandNamePlaceholder", "Distinction")}
                    value={row.label}
                    onChange={(e) => updateRow(row.key, { label: e.target.value })}
                    disabled={disabled}
                    sx={{ minWidth: 180 }}
                  />

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
                  allowDefault={false}
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
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              borderColor: "var(--border-default)",
              color: "var(--ai-violet)",
              "&:hover": {
                borderColor: "color-mix(in srgb, var(--ai-violet) 45%, var(--border-default))",
                bgcolor: "color-mix(in srgb, var(--ai-violet) 6%, transparent)",
              },
            }}
          >
            {t("certificatesUpload.ruleAdd", "Add a band")}
          </Button>
        ) : null}

        <LoadingButton
          variant="contained"
          onClick={() => void handleSave()}
          loading={saving}
          disabled={disabled || loading || !dirty || !validation.valid}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2,
            px: 2.5,
            // An unstyled `variant="contained"` paints `palette.primary.main`, which
            // is overridden per tenant - so this save button was a different colour at
            // every institution. --gradient-ai is the admin dialect's own primary and
            // is what the assessment edit page already uses for its actions; on the
            // adaptive-course page it reads as a sibling of that page's violet, and
            // deliberately does not match its "Save settings" button, because these two
            // buttons write to two different backends (see the header of
            // CertificateAdminSection).
            background: "var(--gradient-ai)",
            color: "#fff",
            "&:hover": { background: "var(--gradient-ai)", filter: "brightness(1.06)" },
            "&.Mui-disabled": { background: "var(--border-default)", color: "var(--font-tertiary)" },
          }}
        >
          {saveLabel ?? t("certificatesUpload.ruleSave", "Save certificate rules")}
        </LoadingButton>

        {dirty && validation.valid ? (
          <Typography sx={{ fontSize: "0.78rem", color: "var(--ai-violet)", fontWeight: 700 }}>
            {t("certificatesUpload.ruleUnsaved", "Unsaved changes")}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}
