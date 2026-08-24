"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Chip,
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
import { alpha, useTheme } from "@mui/material/styles";
import { IconWrapper } from "@/components/common/IconWrapper";
import { CertificatePreview } from "@/components/certificate/CertificatePreview";
import { useCertificateArtworkLabels } from "@/components/certificate/CertificateArtwork";
import { getPreset } from "@/lib/certificates/presets";
import type {
  CertificateIssuer,
  CertificateTemplate,
} from "@/lib/certificates/types";
import { Surface, previewPayloadFromTemplate } from "./shared";

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
  onSetDefault: (template: CertificateTemplate) => void;
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
  const theme = useTheme();
  const labels = useCertificateArtworkLabels();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const preset = getPreset(template.preset);
  const archived = template.is_active === false;

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
        transition: theme.transitions.create(["opacity", "transform", "box-shadow"]),
        "&:hover": { transform: "translateY(-2px)" },
      }}
    >
      <Box
        sx={{
          p: 1.5,
          bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.05 : 0.03),
          borderBottom: "1px solid",
          borderColor: alpha(theme.palette.divider, 0.7),
          cursor: "pointer",
        }}
        onClick={() => onEdit(template)}
      >
        <CertificatePreview payload={payload} labels={labels} radius={8} elevated={false} />
      </Box>

      <Box sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column", gap: 1.25 }}>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="subtitle1"
              fontWeight={800}
              sx={{
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={template.name}
            >
              {template.name}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {template.title}
            </Typography>
          </Box>
          <Tooltip title={t("certificatesUpload.templateActions", "Template actions")}>
            <span>
              <IconButton
                size="small"
                disabled={busy}
                onClick={(e) => setAnchor(e.currentTarget)}
                aria-label={t("certificatesUpload.templateActions", "Template actions")}
              >
                <IconWrapper icon="mdi:dots-vertical" size={20} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <Chip
            size="small"
            variant="outlined"
            sx={{ borderRadius: 1.5, fontWeight: 600 }}
            icon={
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  ml: "6px !important",
                  background: `linear-gradient(135deg, ${preset.palette.accent}, ${preset.palette.metal})`,
                }}
              />
            }
            label={preset.label}
          />
          <Chip
            size="small"
            variant="outlined"
            sx={{ borderRadius: 1.5, textTransform: "capitalize" }}
            label={layoutLabel}
          />
          {template.is_default ? (
            <Chip
              size="small"
              color="warning"
              sx={{ borderRadius: 1.5, fontWeight: 700 }}
              icon={<IconWrapper icon="mdi:star" size={14} />}
              label={t("certificatesUpload.defaultBadge", "Default")}
            />
          ) : null}
          {archived ? (
            <Chip
              size="small"
              variant="outlined"
              color="default"
              sx={{ borderRadius: 1.5 }}
              icon={<IconWrapper icon="mdi:archive-outline" size={14} />}
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
        slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 232 } } }}
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
        <MenuItem
          disabled={Boolean(template.is_default) || archived}
          onClick={() => {
            setAnchor(null);
            onSetDefault(template);
          }}
        >
          <ListItemIcon>
            <IconWrapper icon="mdi:star-outline" size={20} />
          </ListItemIcon>
          <ListItemText>
            {t("certificatesUpload.setDefault", "Set as default design")}
          </ListItemText>
        </MenuItem>
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
        <Divider />
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onToggleArchive(template);
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
        <MenuItem
          sx={{ color: "error.main" }}
          onClick={() => {
            setAnchor(null);
            onDelete(template);
          }}
        >
          <ListItemIcon sx={{ color: "error.main" }}>
            <IconWrapper icon="mdi:trash-can-outline" size={20} />
          </ListItemIcon>
          <ListItemText>{t("certificatesUpload.delete", "Delete")}</ListItemText>
        </MenuItem>
      </Menu>
    </Surface>
  );
}
