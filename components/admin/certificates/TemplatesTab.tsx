"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useToast } from "@/components/common/Toast";
import { adminCertificatesService } from "@/lib/services/certificates.service";
import {
  CERTIFICATE_PRESETS,
  CERTIFICATE_PRESET_ORDER,
} from "@/lib/certificates/presets";
import type {
  CertificateIssuer,
  CertificatePresetSlug,
  CertificateSourceKind,
  CertificateTemplate,
} from "@/lib/certificates/types";
import { TemplateCard } from "./TemplateCard";
import { TemplateEditorDialog } from "./TemplateEditorDialog";
import { EmptyState, Surface, certificateAdminKeys } from "./shared";

/**
 * The design library.
 *
 * Templates are the only place a certificate's look is decided, so this tab is
 * a gallery of real renders rather than a list of names. The preset row at the
 * top exists because a tenant's very first visit finds an empty library, and
 * "create a template" from nothing is a much worse starting point than "pick
 * the look you want and adjust it".
 */

type Filter = "all" | "active" | "archived";

/** Human copy for a default's scope, used in the toast. */
const DEFAULT_FOR_COPY: Record<CertificateSourceKind, string> = {
  adaptive_course: "course completions",
  assessment: "assessments",
  points: "the points ladder",
};

export interface TemplatesTabProps {
  clientId: string | number;
  issuer: CertificateIssuer;
  /** Hands the template to the Assignments tab. */
  onAssignTemplate: (template: CertificateTemplate) => void;
}

export function TemplatesTab({ clientId, issuer, onAssignTemplate }: TemplatesTabProps) {
  const { t } = useTranslation("common");
  const theme = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<CertificateTemplate | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [startPreset, setStartPreset] = useState<CertificatePresetSlug | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<CertificateTemplate | null>(null);

  // Archived designs are hidden by default and fetched only when asked for, so
  // "Archived" is a real filter over the whole library rather than a filter
  // over the subset the server chose to send. The text search stays local: the
  // library is small and instant repaint beats a request per keystroke.
  const includeArchived = filter !== "active";
  const templatesQuery = useQuery({
    queryKey: [...certificateAdminKeys.templates(clientId), { includeArchived }],
    queryFn: () =>
      adminCertificatesService.listTemplates(clientId, {
        include_archived: includeArchived,
      }),
  });

  // The server's preset list is authoritative for what a template may be built
  // from; the local mirror only drives instant repaint. When the call fails we
  // still show the local order rather than an empty gallery, because a preset
  // row is the empty state's only call to action.
  const presetsQuery = useQuery({
    queryKey: certificateAdminKeys.presets(clientId),
    queryFn: () => adminCertificatesService.presets(clientId),
    staleTime: 30 * 60 * 1000,
  });

  /**
   * The preset row, drawn from the SERVER's `resolved_palette` where we have it.
   *
   * `palette` is the preset as authored; `resolved_palette` is what a template
   * using it would actually draw for THIS tenant, with the workspace colour
   * already substituted into the three brandAccent presets. Swatches painted
   * from the local mirror show an admin colours their certificates will not
   * have. The mirror stays as the fallback, because the preset row is the empty
   * state's only call to action and must not vanish if the call fails.
   */
  const presetRow = useMemo(() => {
    const fromServer = (presetsQuery.data?.presets ?? []).filter(
      (p) => p.slug in CERTIFICATE_PRESETS,
    );
    if (fromServer.length > 0) {
      return fromServer.map((p) => ({
        slug: p.slug,
        label: p.label,
        palette: p.resolved_palette ?? p.palette,
      }));
    }
    return CERTIFICATE_PRESET_ORDER.map((slug) => ({
      slug,
      label: CERTIFICATE_PRESETS[slug].label,
      palette: CERTIFICATE_PRESETS[slug].palette,
    }));
  }, [presetsQuery.data]);

  // Memoised because `?? []` is a fresh array on every render, which would make
  // the filter below recompute (and the whole gallery of live artwork re-render)
  // on every keystroke anywhere in the tab.
  const templates = useMemo(() => templatesQuery.data ?? [], [templatesQuery.data]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((tpl) => {
      // `is_archived`, never `is_active`. Flipping is_active only hides a design
      // from pickers; the design keeps issuing to every learner whose rule
      // points at it, which is the opposite of what "archived" promises.
      if (filter === "active" && tpl.is_archived) return false;
      if (filter === "archived" && !tpl.is_archived) return false;
      if (!q) return true;
      return (
        tpl.name.toLowerCase().includes(q) ||
        tpl.description.toLowerCase().includes(q) ||
        tpl.preset.toLowerCase().includes(q)
      );
    });
  }, [templates, search, filter]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: certificateAdminKeys.templates(clientId) });
    queryClient.invalidateQueries({ queryKey: certificateAdminKeys.overview(clientId) });
  };

  const duplicate = useMutation({
    mutationFn: (tpl: CertificateTemplate) =>
      adminCertificatesService.duplicateTemplate(clientId, tpl.id),
    onSuccess: () => {
      invalidate();
      showToast(t("certificatesUpload.templateDuplicated", "Template duplicated."), "success");
    },
    onError: (err: unknown) =>
      showToast(
        err instanceof Error
          ? err.message
          : t("certificatesUpload.templateDuplicateError", "Could not duplicate the template."),
        "error",
      ),
  });

  const update = useMutation({
    mutationFn: ({
      tpl,
      body,
    }: {
      tpl: CertificateTemplate;
      body: Parameters<typeof adminCertificatesService.updateTemplate>[2];
      message: string;
    }) => adminCertificatesService.updateTemplate(clientId, tpl.id, body),
    onSuccess: (_data, variables) => {
      invalidate();
      showToast(variables.message, "success");
    },
    onError: (err: unknown) =>
      showToast(
        err instanceof Error
          ? err.message
          : t("certificatesUpload.templateSaveError", "Could not save the template."),
        "error",
      ),
  });

  /** DELETE archives. It answers 200 with the archived row and a `detail`
   *  sentence explaining why, and that sentence is worth showing: an admin who
   *  meant "delete" should learn what actually happened to the design. */
  const archive = useMutation({
    mutationFn: (tpl: CertificateTemplate) =>
      adminCertificatesService.deleteTemplate(clientId, tpl.id),
    onSuccess: (archived) => {
      invalidate();
      showToast(
        archived.detail ||
          t("certificatesUpload.templateArchived", "Template archived."),
        "success",
      );
    },
    onError: (err: unknown) =>
      showToast(
        err instanceof Error
          ? err.message
          : t("certificatesUpload.templateArchiveError", "Could not archive the template."),
        "error",
      ),
  });

  const busy = duplicate.isPending || update.isPending || archive.isPending;

  const openPreset = (slug: CertificatePresetSlug) => {
    setEditing(null);
    setStartPreset(slug);
    setEditorOpen(true);
  };

  return (
    <Stack spacing={2.5}>
      {/* Preset quick-start */}
      <Surface>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ sm: "center" }}
          sx={{ mb: 1.5 }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={800}>
              {t("certificatesUpload.presetRowTitle", "Start from a preset")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t(
                "certificatesUpload.presetRowHint",
                "Ten finished looks. The three brand presets pick up your workspace colour automatically.",
              )}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={() => {
              setEditing(null);
              setStartPreset(undefined);
              setEditorOpen(true);
            }}
            startIcon={<IconWrapper icon="mdi:plus" size={20} />}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, flexShrink: 0 }}
          >
            {t("certificatesUpload.newTemplate", "New template")}
          </Button>
        </Stack>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
            gap: 1,
          }}
        >
          {presetRow.map(({ slug, label, palette }) => {
            return (
              <Tooltip
                key={slug}
                title={t("certificatesUpload.presetUseHint", "Create a template from this preset")}
              >
                <Box
                  role="button"
                  tabIndex={0}
                  onClick={() => openPreset(slug)}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === "Enter" || e.key === " ") openPreset(slug);
                  }}
                  sx={{
                    cursor: "pointer",
                    borderRadius: 2,
                    p: 0.75,
                    border: "1px solid",
                    borderColor: alpha(theme.palette.divider, 0.85),
                    transition: theme.transitions.create(["border-color", "transform"]),
                    "&:hover": {
                      transform: "translateY(-2px)",
                      borderColor: theme.palette.warning.main,
                    },
                  }}
                >
                  <Box
                    sx={{
                      height: 46,
                      borderRadius: 1.5,
                      background: palette.bg,
                      display: "grid",
                      placeItems: "center",
                      border: `1px solid ${palette.frame}`,
                    }}
                  >
                    <Box
                      sx={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${palette.accent}, ${palette.metal})`,
                      }}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mt: 0.5,
                      fontWeight: 700,
                      fontSize: 10.5,
                      textAlign: "center",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Surface>

      {/* Toolbar */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ sm: "center" }}
      >
        <TextField
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("certificatesUpload.searchTemplates", "Search templates")}
          sx={{ flex: 1, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconWrapper icon="mdi:magnify" size={20} />
              </InputAdornment>
            ),
          }}
        />
        <ToggleButtonGroup
          exclusive
          size="small"
          value={filter}
          onChange={(_, v) => {
            if (v) setFilter(v as Filter);
          }}
          sx={{ "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 700, borderRadius: 2, px: 2 } }}
        >
          <ToggleButton value="all">{t("certificatesUpload.filterAll", "All")}</ToggleButton>
          <ToggleButton value="active">{t("certificatesUpload.filterActive", "Active")}</ToggleButton>
          <ToggleButton value="archived">
            {t("certificatesUpload.filterArchived", "Archived")}
          </ToggleButton>
        </ToggleButtonGroup>
        <Chip
          size="small"
          variant="outlined"
          sx={{ borderRadius: 1.5, fontWeight: 700 }}
          // Deliberately not named `count`: i18next treats a `count` option as
          // a plural selector and goes looking for templateCount_one /
          // templateCount_other before falling back, which is machinery this
          // string does not want.
          label={t("certificatesUpload.templateCount", "{{shown}} shown", {
            shown: visible.length,
          })}
        />
        {busy ? <CircularProgress size={18} /> : null}
      </Stack>

      {/* Gallery */}
      {templatesQuery.isLoading ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 2.5,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={280} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      ) : templatesQuery.isError ? (
        <EmptyState
          icon="mdi:cloud-alert-outline"
          title={t("certificatesUpload.templatesErrorTitle", "The design library did not load")}
          body={t(
            "certificatesUpload.templatesErrorBody",
            "The certificates service did not answer. Nothing has been changed, so retrying is safe.",
          )}
          action={
            <Button
              variant="contained"
              onClick={() => templatesQuery.refetch()}
              startIcon={<IconWrapper icon="mdi:refresh" size={20} />}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
            >
              {t("common.retry", "Try again")}
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={templates.length === 0 ? "mdi:certificate-outline" : "mdi:file-search-outline"}
          title={
            templates.length === 0
              ? t("certificatesUpload.noTemplatesTitle", "No designs yet")
              : t("certificatesUpload.noMatchTitle", "Nothing matches that")
          }
          body={
            templates.length === 0
              ? t(
                  "certificatesUpload.noTemplatesBody",
                  "A template is the look a certificate is printed on. Pick one of the presets above and adjust the wording, colours and ornamentation until it is yours.",
                )
              : t(
                  "certificatesUpload.noMatchBody",
                  "Try a different search, or switch the filter back to All to include archived designs.",
                )
          }
          action={
            templates.length === 0 ? (
              <Button
                variant="contained"
                onClick={() => openPreset("brand-classic")}
                startIcon={<IconWrapper icon="mdi:plus" size={20} />}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
              >
                {t("certificatesUpload.createFirstTemplate", "Create the first design")}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                {t("certificatesUpload.clearFilters", "Clear the filters")}
              </Button>
            )
          }
        />
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 2.5,
          }}
        >
          {visible.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              template={tpl}
              issuer={issuer}
              busy={busy}
              onEdit={(target) => {
                setEditing(target);
                setStartPreset(undefined);
                setEditorOpen(true);
              }}
              onDuplicate={(target) => duplicate.mutate(target)}
              /* A default is scoped to a source kind, and the toast has to say
                 which: "{{name}} is now the default design" was both wrong (the
                 field did not exist, so the PATCH was a silent no-op reported
                 as success) and unanswerable (default for what?). */
              onSetDefault={(target, kind) =>
                update.mutate({
                  tpl: target,
                  body: { default_for: kind },
                  message: kind
                    ? t(
                        "certificatesUpload.defaultSetFor",
                        "{{name}} is now the default for {{scope}}.",
                        { name: target.name, scope: DEFAULT_FOR_COPY[kind] },
                      )
                    : t(
                        "certificatesUpload.defaultCleared",
                        "{{name}} is no longer a default.",
                        { name: target.name },
                      ),
                })
              }
              /* Restore only. Archiving goes through onDelete, which confirms
                 first and calls the endpoint that archives. */
              onToggleArchive={(target) =>
                update.mutate({
                  tpl: target,
                  body: { is_archived: false, is_active: true },
                  message: t("certificatesUpload.templateRestored", "Template restored."),
                })
              }
              onDelete={(target) => setPendingDelete(target)}
              onAssign={onAssignTemplate}
            />
          ))}
        </Box>
      )}

      <TemplateEditorDialog
        open={editorOpen}
        clientId={clientId}
        issuer={issuer}
        template={editing}
        initialPreset={startPreset}
        onClose={() => setEditorOpen(false)}
      />

      {/* The confirmation names the consequence in numbers the server already
          sent, because "archive" is only obviously the right behaviour once an
          admin can see how much is hanging off the design. */}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t("certificatesUpload.archiveTemplateTitle", "Archive this design?")}
        message={t(
          "certificatesUpload.archiveTemplateBody",
          "It leaves every picker and stops being awarded. {{rules}} band(s) and {{tiers}} ladder rung(s) currently point at it and will need a new design. The {{issued}} certificate(s) already issued from it keep the exact artwork they were issued with, so nothing a learner holds changes. You can restore it at any time.",
          {
            rules: pendingDelete?.usage.rules ?? 0,
            tiers: pendingDelete?.usage.tiers ?? 0,
            issued: pendingDelete?.usage.issued ?? 0,
          },
        )}
        confirmText={t("certificatesUpload.archive", "Archive")}
        cancelText={t("common.cancel", "Cancel")}
        confirmColor="warning"
        onConfirm={() => {
          if (pendingDelete) archive.mutate(pendingDelete);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </Stack>
  );
}
