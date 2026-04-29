"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Avatar,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ImageUrlDialog } from "./ImageUrlDialog";

interface ProfileHeaderProps {
  userName: string;
  profilePicUrl?: string;
  role?: string;
  headline?: string;
  location?: string;
  onEdit?: () => void;
  onEditProfilePicUrl?: (url: string) => Promise<void>;
  onEditHeadline?: (headline: string) => Promise<void>;
}

export function ProfileHeader({
  userName,
  profilePicUrl,
  role = "Student",
  headline,
  location,
  onEdit,
  onEditProfilePicUrl,
  onEditHeadline,
}: ProfileHeaderProps) {
  const { t } = useTranslation("common");
  const [profilePicHovered, setProfilePicHovered] = useState(false);
  const [headlineHovered, setHeadlineHovered] = useState(false);
  const [headlineDialogOpen, setHeadlineDialogOpen] = useState(false);
  const [profilePicDialogOpen, setProfilePicDialogOpen] = useState(false);
  const [headlineValue, setHeadlineValue] = useState(headline || "");
  const [savingHeadline, setSavingHeadline] = useState(false);
  const displayLocation = location || "";

  // Sync headline value when prop changes
  useEffect(() => {
    setHeadlineValue(headline || "");
  }, [headline]);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        px: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 },
        pb: 3,
        pt: { xs: 8, sm: 9, md: 10 },
      }}
    >
      {/* Profile Picture - Positioned over cover photo */}
      <Box
        sx={{
          position: "absolute",
          top: { xs: -64, sm: -88, md: -128 },
          left: { xs: 16, sm: 24, md: 40, lg: 48, xl: 56 },
          zIndex: 1,
        }}
        onMouseEnter={() => setProfilePicHovered(true)}
        onMouseLeave={() => setProfilePicHovered(false)}
      >
        <Box sx={{ position: "relative" }}>
          <Avatar
            src={profilePicUrl}
            alt={userName}
            sx={{
              width: { xs: 104, sm: 132, md: 180 },
              height: { xs: 104, sm: 132, md: 180 },
              border: {
                xs: "4px solid color-mix(in srgb, var(--background) 95%, transparent)",
                sm: "5px solid color-mix(in srgb, var(--background) 95%, transparent)",
              },
              boxShadow:
                "0 4px 24px color-mix(in srgb, var(--font-primary) 22%, transparent), 0 0 0 1px color-mix(in srgb, var(--font-primary) 8%, transparent)",
              cursor: onEditProfilePicUrl ? "pointer" : "default",
              backgroundColor: "var(--surface)",
              color: "var(--font-light)",
            }}
          >
            {userName?.[0]?.toUpperCase()}
          </Avatar>
          {onEditProfilePicUrl && profilePicHovered && (
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                insetInlineEnd: 0,
                width: { xs: 40, sm: 44, md: 52 },
                height: { xs: 40, sm: 44, md: 52 },
                borderRadius: "50%",
                backgroundColor: "var(--accent-indigo)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "3px solid color-mix(in srgb, var(--background) 95%, transparent)",
                cursor: "pointer",
                boxShadow: "0 2px 4px color-mix(in srgb, var(--font-primary) 20%, transparent)",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "var(--accent-indigo-dark)",
                },
              }}
              onClick={() => setProfilePicDialogOpen(true)}
            >
              <IconWrapper icon="mdi:link-variant" size={20} color="var(--font-light)" />
            </Box>
          )}
        </Box>
      </Box>

      {/* Profile Info Section */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "flex-end" },
          gap: 2,
          pt: { xs: 0, sm: 0 },
          mt: { xs: 0, sm: 0 },
        }}
      >
        {/* Left: Name and Info */}
        <Box sx={{ flex: 1, minWidth: 0, pl: { xs: 0, sm: 0, md: 0 }, mt: { xs: 0, sm: 0 } }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "var(--font-primary)",
              fontSize: { xs: "1.25rem", sm: "1.5rem", md: "2rem" },
              mb: { xs: 0.25, sm: 0.5 },
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}
          >
            {userName}
          </Typography>
          {/* Headline Section - Edit icon always in DOM to prevent layout shift */}
          <Box
            onMouseEnter={() => setHeadlineHovered(true)}
            onMouseLeave={() => setHeadlineHovered(false)}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: { xs: 0.5, sm: 0.75 },
              mb: { xs: 0.5, sm: 1 },
              minHeight: { xs: 28, sm: 32 },
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: headline ? "var(--font-secondary)" : "var(--font-tertiary)",
                fontSize: { xs: "0.8125rem", sm: "0.875rem", md: "1rem" },
                fontWeight: 400,
                lineHeight: 1.4,
                fontStyle: headline ? "normal" : "italic",
              }}
            >
              {headline || t("profile.addHeadline")}
            </Typography>
            {onEditHeadline && (
              <IconButton
                size="small"
                onClick={() => {
                  setHeadlineValue(headline || "");
                  setHeadlineDialogOpen(true);
                }}
                sx={{
                  width: { xs: 28, sm: 32 },
                  height: { xs: 28, sm: 32 },
                  minWidth: { xs: 28, sm: 32 },
                  flexShrink: 0,
                  color: "var(--accent-indigo)",
                  opacity: headlineHovered || !headline ? 1 : 0,
                  pointerEvents: headlineHovered || !headline ? "auto" : "none",
                  transition: "opacity 0.2s ease",
                  "&:hover": {
                    backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                  },
                }}
              >
                <IconWrapper icon="mdi:pencil" size={16} />
              </IconButton>
            )}
          </Box>
          {displayLocation && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 0.5, sm: 0.75 },
                mt: { xs: 0.25, sm: 0.5 },
              }}
            >
              <IconWrapper icon="mdi:map-marker" size={16} color="var(--font-secondary)" />
              <Typography
                variant="body2"
                sx={{
                  color: "var(--font-secondary)",
                  fontSize: { xs: "0.8125rem", sm: "0.9375rem" },
                  fontWeight: 400,
                }}
              >
                {displayLocation}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Right: Action Buttons */}
        {onEdit && (
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
            }}
          >
            <Button
              variant="outlined"
              startIcon={<IconWrapper icon="mdi:pencil" size={18} />}
              onClick={onEdit}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: { xs: "0.875rem", sm: "0.9375rem" },
                color: "var(--accent-indigo)",
                borderColor: "var(--accent-indigo)",
                borderRadius: "24px",
                px: { xs: 1.5, sm: 2 },
                py: { xs: 0.5, sm: 0.75 },
                minWidth: { xs: "auto", sm: "auto" },
                "&:hover": {
                  borderColor: "var(--accent-indigo-dark)",
                  backgroundColor: "color-mix(in srgb, var(--accent-indigo) 6%, transparent)",
                  borderWidth: "2px",
                },
                transition: "all 0.2s ease",
              }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                {t("profile.editProfile")}
              </Box>
              <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
                {t("profile.edit")}
              </Box>
            </Button>
          </Box>
        )}
      </Box>

      {/* Headline Edit Dialog */}
      <Dialog
        open={headlineDialogOpen}
        onClose={() => {
          setHeadlineDialogOpen(false);
          setHeadlineValue(headline || "");
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 2 },
            boxShadow: "0 8px 24px color-mix(in srgb, var(--font-primary) 16%, transparent)",
            m: { xs: 0, sm: 2 },
            maxHeight: { xs: "100vh", sm: "90vh" },
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: { xs: 1.5, sm: 2 },
            px: { xs: 2.5, sm: 3 },
            pt: { xs: 2.5, sm: 3 },
            borderBottom: "1px solid var(--border-default)",
            backgroundColor: "color-mix(in srgb, var(--surface) 82%, var(--background))",
            display: "flex",
            alignItems: "center",
            gap: { xs: 1.25, sm: 1.5 },
          }}
        >
          <Box
            sx={{
              width: { xs: 36, sm: 40 },
              height: { xs: 36, sm: 40 },
              borderRadius: "50%",
              backgroundColor: "color-mix(in srgb, var(--accent-indigo) 12%, transparent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconWrapper icon="mdi:format-text" size={20} color="var(--accent-indigo)" />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "var(--font-primary)",
                fontSize: { xs: "1.125rem", sm: "1.25rem" },
                mb: 0.25,
              }}
            >
              {t("profile.editHeadline")}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "var(--font-secondary)",
                fontSize: "0.8125rem",
                fontWeight: 400,
              }}
            >
              {t("profile.headlineHelper")}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent 
          sx={{ 
            pt: { xs: 4.5, sm: 5 }, 
            px: { xs: 2.5, sm: 3 }, 
            pb: 2,
            overflow: "auto",
            flex: "1 1 auto",
            minHeight: 0,
          }}
        >
          <TextField
            label="Headline"
            value={headlineValue}
            onChange={(e) => setHeadlineValue(e.target.value)}
            fullWidth
            multiline
            rows={3}
            minRows={3}
            maxRows={5}
            size="medium"
            placeholder="e.g., Software Engineer | Full Stack Developer | React Specialist"
            InputLabelProps={{ shrink: true }}
            helperText={
              <Box
                component="span"
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 1,
                  width: "100%",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "var(--font-secondary)",
                    fontSize: "0.8125rem",
                    flex: 1,
                  }}
                >
                  This appears right below your name on your profile
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color:
                      headlineValue.length > 120
                        ? "var(--error-500)"
                        : "var(--font-tertiary)",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    ml: 2,
                    flexShrink: 0,
                  }}
                >
                  {headlineValue.length}/120
                </Typography>
              </Box>
            }
            inputProps={{
              maxLength: 120,
            }}
            InputProps={{
              sx: {
                alignItems: "flex-start",
              },
            }}
            sx={{
              mt: 1.5,
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
                fontSize: "0.9375rem",
                backgroundColor: "var(--background)",
                padding: "12px 14px",
                "& textarea": {
                  overflow: "auto !important",
                  resize: "vertical",
                  minHeight: "60px !important",
                  maxHeight: "120px !important",
                  lineHeight: "1.5",
                  padding: "0 !important",
                  margin: "0 !important",
                  verticalAlign: "top",
                },
                "&:hover": {
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--accent-indigo)",
                  },
                },
                "&.Mui-focused": {
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--accent-indigo)",
                    borderWidth: "2px",
                  },
                },
              },
              "& .MuiInputLabel-root": {
                fontSize: "0.9375rem",
                fontWeight: 500,
                color: "var(--font-secondary)",
                "&.Mui-focused": {
                  color: "var(--accent-indigo)",
                },
              },
              "& .MuiFormHelperText-root": {
                margin: 0,
                mt: 1,
                position: "relative",
                width: "100%",
              },
            }}
          />
          <Box
            sx={{
              mt: 2.5,
              p: 2,
              borderRadius: 1.5,
              backgroundColor: "color-mix(in srgb, var(--surface) 82%, var(--background))",
              border: "1px solid var(--border-default)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <IconWrapper icon="mdi:lightbulb-outline" size={18} color="var(--accent-indigo)" />
              <Typography
                variant="caption"
                sx={{
                  color: "var(--font-primary)",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                }}
              >
                Tips for a great headline
              </Typography>
            </Box>
            <Box component="ul" sx={{ m: 0, pl: 2.5, listStyle: "none" }}>
              <Box
                component="li"
                sx={{
                  color: "var(--font-secondary)",
                  fontSize: "0.8125rem",
                  mb: 0.75,
                  position: "relative",
                  "&::before": {
                    content: '"•"',
                    position: "absolute",
                    left: -16,
                    color: "var(--accent-indigo)",
                    fontWeight: "bold",
                  },
                }}
              >
                Include your current role or area of expertise
              </Box>
              <Box
                component="li"
                sx={{
                  color: "var(--font-secondary)",
                  fontSize: "0.8125rem",
                  mb: 0.75,
                  position: "relative",
                  "&::before": {
                    content: '"•"',
                    position: "absolute",
                    left: -16,
                    color: "var(--accent-indigo)",
                    fontWeight: "bold",
                  },
                }}
              >
                Use keywords relevant to your field
              </Box>
              <Box
                component="li"
                sx={{
                  color: "var(--font-secondary)",
                  fontSize: "0.8125rem",
                  position: "relative",
                  "&::before": {
                    content: '"•"',
                    position: "absolute",
                    left: -16,
                    color: "var(--accent-indigo)",
                    fontWeight: "bold",
                  },
                }}
              >
                Keep it concise and professional
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            px: { xs: 2.5, sm: 3 },
            py: { xs: 2, sm: 2.5 },
            borderTop: "1px solid var(--border-default)",
            gap: { xs: 1, sm: 1.25 },
            flexDirection: { xs: "column-reverse", sm: "row" },
            backgroundColor: "var(--background)",
          }}
        >
          <Button
            onClick={() => {
              setHeadlineDialogOpen(false);
              setHeadlineValue(headline || "");
            }}
            disabled={savingHeadline}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "var(--font-secondary)",
              borderRadius: "24px",
              px: { xs: 3, sm: 3 },
              py: { xs: 1.125, sm: 0.875 },
              width: { xs: "100%", sm: "auto" },
              minWidth: { xs: "auto", sm: 100 },
              border: "1px solid var(--border-default)",
              "&:hover": {
                backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--background))",
                borderColor: "color-mix(in srgb, var(--border-default) 85%, var(--font-secondary))",
              },
              transition: "all 0.2s ease",
            }}
          >
            {t("profile.cancel")}
          </Button>
          <Button
            onClick={async () => {
              if (onEditHeadline) {
                try {
                  setSavingHeadline(true);
                  await onEditHeadline(headlineValue.trim());
                  setHeadlineDialogOpen(false);
                } catch (error) {
                  // Error handling
                } finally {
                  setSavingHeadline(false);
                }
              }
            }}
            variant="contained"
            disabled={savingHeadline}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: "var(--accent-indigo)",
              borderRadius: "24px",
              px: { xs: 3, sm: 3.5 },
              py: { xs: 1.125, sm: 0.875 },
              width: { xs: "100%", sm: "auto" },
              minWidth: { xs: "auto", sm: 120 },
              boxShadow: "0 2px 4px color-mix(in srgb, var(--accent-indigo) 30%, transparent)",
              "&:hover": {
                backgroundColor: "var(--accent-indigo-dark)",
                boxShadow: "0 4px 8px color-mix(in srgb, var(--accent-indigo) 36%, transparent)",
              },
              "&:disabled": {
                backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--border-default))",
                color: "var(--font-tertiary)",
                boxShadow: "none",
              },
              transition: "all 0.2s ease",
            }}
          >
            {savingHeadline ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    border: "2px solid color-mix(in srgb, var(--font-light) 35%, transparent)",
                    borderTop: "2px solid var(--font-light)",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                    "@keyframes spin": {
                      "0%": { transform: "rotate(0deg)" },
                      "100%": { transform: "rotate(360deg)" },
                    },
                  }}
                />
                {t("profile.saving")}
              </Box>
            ) : (
              t("profile.save")
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profile Picture URL Dialog */}
      {onEditProfilePicUrl && (
        <ImageUrlDialog
          open={profilePicDialogOpen}
          onClose={() => setProfilePicDialogOpen(false)}
          onSave={onEditProfilePicUrl}
          title={t("profile.editProfilePicture")}
          subtitle="Paste an image URL to use as your profile picture"
          currentImageUrl={profilePicUrl}
          placeholder="https://example.com/profile-picture.jpg"
        />
      )}
    </Box>
  );
}
