"use client";

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Tooltip,
  Typography,
  Stack,
  TextField,
} from "@mui/material";
import { LoadingButton } from "@/components/common/LoadingButton";
import { IconWrapper } from "@/components/common/IconWrapper";
import { SegmentedTabs } from "@/components/admin/assessment/shared";
import type { CertificateUploadTier } from "@/lib/services/file-upload.service";
import {
  Surface,
  Eyebrow,
  MetaPill,
  primaryButtonSx,
  secondaryButtonSx,
  fieldSx,
  CERT_BADGE_GRADIENT,
} from "./shared";

/**
 * The background-artwork upload card, in the admin dialect.
 *
 * On colour: this card used to run every surface through `useTheme()` +
 * `alpha()` with `theme.palette.mode === "dark"` branches. `palette.mode` is
 * never "dark" in this app, so those branches were unreachable, and
 * `palette.primary` is overridden per tenant - so the drop zone, the tile, the
 * "Select file" button and the Upload button all painted whatever blue an
 * institution had configured, inside a dialog whose every other surface is
 * violet. It now speaks the same CSS custom properties as the rest of
 * components/admin/certificates.
 *
 * On nesting: `Surface` is 18px (`var(--radius-card)`), so the drop zone inside
 * it is 16px (`borderRadius: 2`) rather than the 20px it used to be - an inner
 * radius larger than its container is the tell that two people built the two
 * boxes.
 */

export interface AdminCertificateUploadCardProps {
  tier?: {
    value: CertificateUploadTier;
    onChange: (tier: CertificateUploadTier) => void;
  };
  selectedFile: File | null;
  onSelectFile: (file: File | null) => void;
  onUpload: () => void;
  uploading: boolean;
  lastUrl?: string | null;
  onCopyUrl?: () => void;
  disabled?: boolean;
}

export function AdminCertificateUploadCard({
  tier,
  selectedFile,
  onSelectFile,
  onUpload,
  uploading,
  lastUrl,
  onCopyUrl,
  disabled = false,
}: AdminCertificateUploadCardProps) {
  const { t } = useTranslation("common");
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [dragActive, setDragActive] = useState(false);

  const handlePick = () => inputRef.current?.click();

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    onSelectFile(f ?? null);
    e.target.value = "";
  };

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onSelectFile(f);
  };

  const handleDragEnter: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    dragCounter.current += 1;
    setDragActive(true);
  };

  const handleDragLeave: React.DragEventHandler<HTMLDivElement> = () => {
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragActive(false);
    }
  };

  const tierLocked = disabled || uploading;

  return (
    <Surface sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack spacing={2}>
        {tier ? (
          <Box>
            <Eyebrow sx={{ mb: 1 }}>{t("certificatesUpload.certificateType")}</Eyebrow>
            <Box
              sx={{
                opacity: tierLocked ? 0.55 : 1,
                pointerEvents: tierLocked ? "none" : "auto",
              }}
            >
              <SegmentedTabs<CertificateUploadTier>
                fullWidth
                value={tier.value}
                onChange={(v) => tier.onChange(v)}
                tabs={[
                  {
                    value: "participation",
                    label: t("certificatesUpload.tierParticipation"),
                    icon: "mdi:account-check-outline",
                  },
                  {
                    value: "excellence",
                    label: t("certificatesUpload.tierExcellence"),
                    icon: "mdi:trophy-outline",
                  },
                ]}
              />
            </Box>
          </Box>
        ) : null}

        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap alignItems="center">
          <MetaPill
            icon="mdi:file-document-outline"
            label={t("certificatesUpload.supportedFileTypes")}
          />
          {selectedFile ? (
            <>
              <MetaPill
                icon="mdi:paperclip"
                color="var(--ai-violet)"
                title={selectedFile.name}
                label={
                  selectedFile.name.length > 36
                    ? `${selectedFile.name.slice(0, 34)}…`
                    : selectedFile.name
                }
              />
              <Button
                size="small"
                onClick={() => onSelectFile(null)}
                disabled={tierLocked}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  minWidth: 0,
                  px: 0.75,
                  color: "var(--font-secondary)",
                }}
              >
                {t("common.remove", "Remove")}
              </Button>
            </>
          ) : null}
        </Stack>

        <input
          ref={inputRef}
          type="file"
          hidden
          accept="application/pdf,image/png,image/jpeg,image/gif,image/webp"
          onChange={handleChange}
        />

        <Box
          role="presentation"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          sx={{
            position: "relative",
            border: "1px solid",
            borderColor: dragActive ? "var(--ai-violet)" : "var(--border-default)",
            borderRadius: 2,
            p: { xs: 2.5, sm: 3 },
            textAlign: "center",
            bgcolor: dragActive
              ? "color-mix(in srgb, var(--ai-violet) 8%, var(--card-bg) 92%)"
              : "var(--surface)",
            transition:
              "border-color 160ms ease, background-color 160ms ease, transform 160ms ease",
            transform: dragActive ? "scale(1.005)" : "scale(1)",
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              mx: "auto",
              mb: 1.5,
              display: "grid",
              placeItems: "center",
              background: CERT_BADGE_GRADIENT,
              color: "var(--font-light)",
            }}
          >
            <IconWrapper icon="mdi:cloud-upload-outline" size={28} />
          </Box>
          <Typography
            sx={{
              fontSize: "0.95rem",
              fontWeight: 800,
              color: "var(--font-primary)",
              lineHeight: 1.2,
              mb: 0.5,
            }}
          >
            {dragActive ? t("certificatesUpload.dropHere") : t("certificatesUpload.dropOrPickTitle")}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.78rem",
              color: "var(--font-secondary)",
              lineHeight: 1.55,
              mb: 1.75,
              maxWidth: 360,
              mx: "auto",
            }}
          >
            {t("certificatesUpload.dropOrPickBody")}
          </Typography>
          <Button
            variant="outlined"
            onClick={handlePick}
            disabled={tierLocked}
            sx={{ ...secondaryButtonSx, px: 2.5 }}
          >
            {t("certificatesUpload.selectFile")}
          </Button>
        </Box>

        <LoadingButton
          variant="contained"
          fullWidth
          onClick={onUpload}
          loading={uploading}
          loadingText={t("common.uploading")}
          disabled={disabled || !selectedFile}
          sx={{
            ...primaryButtonSx,
            py: 1.15,
            fontSize: "0.9rem",
            "&.Mui-disabled": {
              background: "var(--border-default)",
              color: "var(--font-tertiary)",
              boxShadow: "none",
            },
          }}
          startIcon={<IconWrapper icon="mdi:upload" size={20} />}
        >
          {t("certificatesUpload.upload")}
        </LoadingButton>

        {lastUrl ? (
          <TextField
            label={t("certificatesUpload.urlLabel")}
            value={lastUrl}
            fullWidth
            size="small"
            multiline
            maxRows={3}
            sx={{
              ...fieldSx,
              "& .MuiOutlinedInput-root": {
                ...fieldSx["& .MuiOutlinedInput-root"],
                bgcolor: "color-mix(in srgb, var(--success-500) 8%, var(--surface) 92%)",
                fontSize: "0.8125rem",
              },
            }}
            InputProps={{
              readOnly: true,
              endAdornment: onCopyUrl ? (
                <InputAdornment position="end">
                  <Tooltip title={t("certificatesUpload.copyUrl")}>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={onCopyUrl}
                      aria-label={t("certificatesUpload.copyUrl")}
                      sx={{ color: "var(--font-secondary)" }}
                    >
                      <IconWrapper icon="mdi:content-copy" size={18} />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ) : undefined,
            }}
          />
        ) : null}
      </Stack>
    </Surface>
  );
}
