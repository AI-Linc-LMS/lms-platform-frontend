"use client";

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  Stack,
  TextField,
  CircularProgress,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { CertificateUploadTier } from "@/lib/services/file-upload.service";

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
  const theme = useTheme();
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

  const accent = theme.palette.primary.main;
  const dropBorder = dragActive ? accent : alpha(theme.palette.divider, theme.palette.mode === "dark" ? 0.35 : 1);
  const dropBg = dragActive
    ? alpha(accent, theme.palette.mode === "dark" ? 0.14 : 0.06)
    : alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.04 : 0.02);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3.5 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: alpha(theme.palette.divider, 0.85),
        background:
          theme.palette.mode === "dark"
            ? alpha(theme.palette.background.paper, 0.6)
            : theme.palette.background.paper,
        boxShadow:
          theme.palette.mode === "dark"
            ? `0 24px 48px -12px ${alpha("#000", 0.45)}`
            : `0 20px 40px -18px ${alpha("#0f172a", 0.12)}, 0 0 0 1px ${alpha("#0f172a", 0.04)}`,
      }}
    >
      <Stack spacing={2.75}>
        {tier ? (
          <Box>
            <Typography
              variant="overline"
              sx={{
                letterSpacing: "0.08em",
                fontWeight: 700,
                color: "text.secondary",
                display: "block",
                mb: 1,
              }}
            >
              {t("certificatesUpload.certificateType")}
            </Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              value={tier.value}
              onChange={(_, v) => {
                if (v) tier.onChange(v as CertificateUploadTier);
              }}
              disabled={disabled || uploading}
              sx={{
                gap: 0,
                "& .MuiToggleButton-root": {
                  flex: 1,
                  py: 1.25,
                  px: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider} !important`,
                  "&.Mui-selected": {
                    bgcolor: alpha(accent, theme.palette.mode === "dark" ? 0.25 : 0.12),
                    color: accent,
                    borderColor: `${alpha(accent, 0.45)} !important`,
                    "&:hover": {
                      bgcolor: alpha(accent, theme.palette.mode === "dark" ? 0.32 : 0.18),
                    },
                  },
                },
              }}
            >
              <ToggleButton value="participation" disableRipple>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <IconWrapper icon="mdi:account-check-outline" size={20} />
                  {t("certificatesUpload.tierParticipation")}
                </Box>
              </ToggleButton>
              <ToggleButton value="excellence" disableRipple>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <IconWrapper icon="mdi:trophy-outline" size={20} />
                  {t("certificatesUpload.tierExcellence")}
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        ) : null}

        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <Chip
            size="small"
            icon={<IconWrapper icon="mdi:file-document-outline" size={16} />}
            label={t("certificatesUpload.supportedFileTypes")}
            variant="outlined"
            sx={{ borderRadius: 2, borderColor: alpha(theme.palette.divider, 0.8) }}
          />
          {selectedFile ? (
            <Chip
              size="small"
              color="primary"
              variant="outlined"
              onDelete={() => onSelectFile(null)}
              sx={{ borderRadius: 2 }}
              label={
                selectedFile.name.length > 36
                  ? `${selectedFile.name.slice(0, 34)}…`
                  : selectedFile.name
              }
            />
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
            border: "2px dashed",
            borderColor: dropBorder,
            borderRadius: 2.5,
            p: { xs: 3, sm: 4 },
            textAlign: "center",
            bgcolor: dropBg,
            transition: theme.transitions.create(["border-color", "background-color", "transform"], {
              duration: theme.transitions.duration.shorter,
            }),
            transform: dragActive ? "scale(1.01)" : "scale(1)",
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              mx: "auto",
              mb: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(accent, theme.palette.mode === "dark" ? 0.2 : 0.1),
              color: accent,
            }}
          >
            <IconWrapper icon="mdi:cloud-upload-outline" size={34} />
          </Box>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            {dragActive ? t("certificatesUpload.dropHere") : t("certificatesUpload.dropOrPickTitle")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 360, mx: "auto" }}>
            {t("certificatesUpload.dropOrPickBody")}
          </Typography>
          <Button
            variant="contained"
            onClick={handlePick}
            disabled={disabled || uploading}
            sx={{
              borderRadius: 2,
              px: 3,
              boxShadow: "none",
              bgcolor: alpha(accent, theme.palette.mode === "dark" ? 0.9 : 1),
              "&:hover": { boxShadow: "none", bgcolor: accent },
            }}
          >
            {t("certificatesUpload.selectFile")}
          </Button>
        </Box>

        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={onUpload}
          disabled={disabled || uploading || !selectedFile}
          sx={{
            borderRadius: 2,
            py: 1.35,
            fontWeight: 700,
            textTransform: "none",
            fontSize: "1rem",
            boxShadow: `0 10px 24px ${alpha(accent, 0.35)}`,
            "&:disabled": {
              boxShadow: "none",
            },
          }}
          startIcon={
            uploading ? (
              <CircularProgress color="inherit" size={22} thickness={5} />
            ) : (
              <IconWrapper icon="mdi:upload" size={22} />
            )
          }
        >
          {uploading ? t("certificatesUpload.uploading") : t("certificatesUpload.upload")}
        </Button>

        {lastUrl ? (
          <TextField
            label={t("certificatesUpload.urlLabel")}
            value={lastUrl}
            fullWidth
            size="small"
            multiline
            maxRows={3}
            InputProps={{
              readOnly: true,
              sx: {
                borderRadius: 2,
                fontFamily: theme.typography.fontFamily,
                fontSize: "0.8125rem",
                bgcolor: alpha(theme.palette.success.main, theme.palette.mode === "dark" ? 0.12 : 0.06),
              },
              endAdornment: onCopyUrl ? (
                <InputAdornment position="end">
                  <Tooltip title={t("certificatesUpload.copyUrl")}>
                    <IconButton edge="end" size="small" onClick={onCopyUrl} aria-label={t("certificatesUpload.copyUrl")}>
                      <IconWrapper icon="mdi:content-copy" size={18} />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ) : undefined,
            }}
          />
        ) : null}
      </Stack>
    </Paper>
  );
}
