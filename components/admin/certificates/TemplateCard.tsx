"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { CertificatePreview } from "@/components/certificate/CertificatePreview";
import { useCertificateArtworkLabels } from "@/components/certificate/CertificateArtwork";
import { getPreset } from "@/lib/certificates/presets";
import type {
  CertificateIssuer,
  CertificateSourceKind,
  CertificateTemplate,
} from "@/lib/certificates/types";

/** The three kinds a template can be the tenant's default for, in the order an
 *  admin thinks about them. */
const DEFAULT_FOR_KINDS: CertificateSourceKind[] = [
  "adaptive_course",
  "assessment",
  "points",
];

const DEFAULT_FOR_FALLBACK: Record<CertificateSourceKind, string> = {
  adaptive_course: "Course completions",
  assessment: "Assessments",
  points: "Points ladder",
};
import { MetaPill, Surface, mediaFrameSx, previewPayloadFromTemplate } from "./shared";

/**
 * One design in the library.
 *
 * The thumbnail is the REAL artwork component scaled down, not a stored PNG.
 * The old module stored an uploaded image per course and an admin could never
 * tell what a learner would actually receive until one was issued; rendering
 * the live component means the card is wrong only if the certificate is wrong.
 * CertificatePreview scales with a transform on an outer wrapper, so a 320px
 * card costs the same as a full-size render and any export taken from it is
 * still full resolution.
 */

export interface TemplateCardProps {
  template: CertificateTemplate;
  issuer: CertificateIssuer;
  onEdit: (template: CertificateTemplate) => void;
  onDuplicate: (template: CertificateTemplate) => void;
  /** `null` clears the default. */
  onSetDefault: (
    template: CertificateTemplate,
    kind: CertificateSourceKind | null,
  ) => void;
  onToggleArchive: (template: CertificateTemplate) => void;
  onDelete: (template: CertificateTemplate) => void;
  /** Jumps to the Assignments tab with this template pre-selected. */
  onAssign: (template: CertificateTemplate) => void;
  busy?: boolean;
}

export function TemplateCard({
  template,
  issuer,
  onEdit,
  onDuplicate,
  onSetDefault,
  onToggleArchive,
  onDelete,
  onAssign,
  busy = false,
}: TemplateCardProps) {
  const { t } = useTranslation("common");
  const labels = useCertificateArtworkLabels();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const preset = getPreset(template.preset);
  // `is_archived`, not `is_active`. They are different flags with different
  // consequences: `is_active` only hides a design from pickers, while
  // `is_archived` is what eligibility and both write validators filter on. An
  // admin who "archived" a design by flipping is_active watched it leave this
  // list while every rule bound to it kept issuing it to learners.
  const archived = template.is_archived;

  // Rebuilt only when the template row itself changes: the artwork draws a few
  // hundred SVG nodes, and a grid of twenty cards re-rendering on every parent
  // state change is the difference between an instant tab and a visible stall.
  const payload = useMemo(
    () => previewPayloadFromTemplate(template, issuer),
    [template, issuer],
  );

  const layoutLabel =
    template.kind === "upload"
      ? t("certificatesUpload.kindUpload", "Uploaded background")
      : t(`certificatesUpload.layout_${template.layout}`, template.layout);

  return (
    <Surface
      padded={false}
      sx={{
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        opacity: archived ? 0.62 : 1,
        transition: "opacity 150ms ease, transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: "var(--ai-violet)",
          boxShadow: "0 1px 2px rgba(16,24,40,0.05), 0 18px 34px -22px rgba(124,58,237,0.45)",
        },
      }}
    >
      {/* The artwork is framed the way the platform frames media: inset on the
          page-canvas tint, closed off by a hairline. The miniature itself is the
          real component, never a stored PNG. */}
      <Box sx={{ ...mediaFrameSx, cursor: "pointer" }} onClick={() => onEdit(template)}>
        <CertificatePreview payload={payload} labels={labels} radius={8} elevated={false} />
      </Box>

      <Box sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column", gap: 1.25 }}>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                fontSize: "0.95rem",
                fontWeight: 800,
                color: "var(--font-primary)",
                lineHeight: 1.2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={template.name}
            >
              {template.name}
            </Typography>
            <Typography
              sx={{
                display: "block",
                mt: 0.25,
                fontSize: "0.72rem",
                color: "var(--font-secondary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {template.description || preset.label}
            </Typography>
          </Box>
          <Tooltip title={t("certificatesUpload.templateActions", "Template actions")}>
            <span>
              <IconButton
                size="small"
                disabled={busy}
                onClick={(e) => setAnchor(e.currentTarget)}
                aria-label={t("certificatesUpload.templateActions", "Template actions")}
                sx={{ color: "var(--font-tertiary)" }}
              >
                <IconWrapper icon="mdi:dots-vertical" size={20} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        {/* One pill recipe at one radius. The preset pill carries the preset's
            own accent-to-metal swatch, which is a sample of the paper rather
            than app chrome, so it keeps the preset's colours. */}
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <MetaPill
            label={
              <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                <Box
                  component="span"
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: 0.75,
                    flexShrink: 0,
                    background: `linear-gradient(135deg, ${preset.palette.accent}, ${preset.palette.metal})`,
                  }}
                />
                {preset.label}
              </Box>
            }
          />
          <MetaPill label={layoutLabel} sx={{ textTransform: "capitalize" }} />
          {template.default_for ? (
            <MetaPill
              icon="mdi:star"
              color="var(--ai-violet)"
              label={t(
                `certificatesUpload.defaultFor_${template.default_for}`,
                DEFAULT_FOR_FALLBACK[template.default_for],
              )}
            />
          ) : null}
          <MetaPill
            icon="mdi:link-variant"
            /* What archiving would orphan, so the admin can see it before
               pressing a button labelled Archive. */
            label={t(
              "certificatesUpload.usageChip",
              "{{rules}} band(s) · {{tiers}} rung(s) · {{issued}} issued",
              {
                rules: template.usage.rules,
                tiers: template.usage.tiers,
                issued: template.usage.issued,
              },
            )}
          />
          {archived ? (
            <MetaPill
              icon="mdi:archive-outline"
              label={t("certificatesUpload.archivedBadge", "Archived")}
            />
          ) : null}
        </Stack>
      </Box>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2.5,
              minWidth: 232,
              border: "1px solid var(--border-default)",
              boxShadow: "0 18px 40px -24px rgba(15,23,42,0.35)",
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onEdit(template);
          }}
        >
          <ListItemIcon>
            <IconWrapper icon="mdi:pencil-outline" size={20} />
          </ListItemIcon>
          <ListItemText>{t("certificatesUpload.edit", "Edit design")}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onDuplicate(template);
          }}
        >
          <ListItemIcon>
            <IconWrapper icon="mdi:content-duplicate" size={20} />
          </ListItemIcon>
          <ListItemText>{t("certificatesUpload.duplicate", "Duplicate")}</ListItemText>
        </MenuItem>
        {/* "Default" is per SOURCE KIND, because that is the shape of the
            question `_template_for` asks: a tenant sets one design for course
            completions and another for the points ladder. A single boolean had
            nothing behind it at all and reported success on a no-op. */}
        <Divider sx={{ borderColor: "var(--border-default)" }} />
        {DEFAULT_FOR_KINDS.map((kind) => (
          <MenuItem
            key={kind}
            disabled={template.default_for === kind || archived}
            onClick={() => {
              setAnchor(null);
              onSetDefault(template, kind);
            }}
          >
            <ListItemIcon>
              <IconWrapper
                icon={template.default_for === kind ? "mdi:star" : "mdi:star-outline"}
                size={20}
              />
            </ListItemIcon>
            <ListItemText>
              {t(
                `certificatesUpload.setDefaultFor_${kind}`,
                `Use by default for ${DEFAULT_FOR_FALLBACK[kind].toLowerCase()}`,
              )}
            </ListItemText>
          </MenuItem>
        ))}
        {template.default_for ? (
          <MenuItem
            onClick={() => {
              setAnchor(null);
              onSetDefault(template, null);
            }}
          >
            <ListItemIcon>
              <IconWrapper icon="mdi:star-off-outline" size={20} />
            </ListItemIcon>
            <ListItemText>
              {t("certificatesUpload.clearDefault", "Stop using this by default")}
            </ListItemText>
          </MenuItem>
        ) : null}
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onAssign(template);
          }}
        >
          <ListItemIcon>
            <IconWrapper icon="mdi:link-variant" size={20} />
          </ListItemIcon>
          <ListItemText>
            {t("certificatesUpload.assignTemplate", "Award for a course or assessment")}
          </ListItemText>
        </MenuItem>
        <Divider sx={{ borderColor: "var(--border-default)" }} />
        {/* There is no "Delete": DELETE on this resource ARCHIVES, and a hard
            delete is not on offer anywhere. Removing a design would CASCADE
            away every band that awards it - a course configured for Distinction
            and Participation would quietly start awarding nothing - and blank
            the ladder rungs and credential provenance pointing at it. Archiving
            gets an admin what they actually asked for. */}
        <MenuItem
          onClick={() => {
            setAnchor(null);
            if (archived) onToggleArchive(template);
            else onDelete(template);
          }}
        >
          <ListItemIcon>
            <IconWrapper
              icon={archived ? "mdi:archive-arrow-up-outline" : "mdi:archive-outline"}
              size={20}
            />
          </ListItemIcon>
          <ListItemText>
            {archived
              ? t("certificatesUpload.restore", "Restore to the library")
              : t("certificatesUpload.archive", "Archive")}
          </ListItemText>
        </MenuItem>

      </Menu>
    </Surface>
  );
}
