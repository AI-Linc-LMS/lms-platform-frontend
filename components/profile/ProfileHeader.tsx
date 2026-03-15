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
              border: { xs: "4px solid #ffffff", sm: "5px solid #ffffff" },
              boxShadow: "0 4px 24px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)",
              cursor: onEditProfilePicUrl ? "pointer" : "default",
              backgroundColor: "#0f172a",
              color: "#ffffff",
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
                backgroundColor: "#0a66c2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "3px solid #ffffff",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "#004182",
                },
              }}
              onClick={() => setProfilePicDialogOpen(true)}
            >
              <IconWrapper icon="mdi:link-variant" size={20} color="#ffffff" />
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
              color: "#000000",
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
                color: headline ? "#666666" : "#9ca3af",
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
                  color: "#0a66c2",
                  opacity: headlineHovered || !headline ? 1 : 0,
                  pointerEvents: headlineHovered || !headline ? "auto" : "none",
                  transition: "opacity 0.2s ease",
                  "&:hover": {
                    backgroundColor: "rgba(10, 102, 194, 0.08)",
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
              <IconWrapper icon="mdi:map-marker" size={16} color="#666666" />
              <Typography
                variant="body2"
                sx={{
                  color: "#666666",
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
                color: "#0a66c2",
                borderColor: "#0a66c2",
                borderRadius: "24px",
                px: { xs: 1.5, sm: 2 },
                py: { xs: 0.5, sm: 0.75 },
                minWidth: { xs: "auto", sm: "auto" },
                "&:hover": {
                  borderColor: "#004182",
                  backgroundColor: "rgba(10, 102, 194, 0.05)",
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
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
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
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            backgroundColor: "#f9fafb",
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
              backgroundColor: "rgba(10, 102, 194, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconWrapper icon="mdi:format-text" size={20} color="#0a66c2" />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "#000000",
                fontSize: { xs: "1.125rem", sm: "1.25rem" },
                mb: 0.25,
              }}
            >
              {t("profile.editHeadline")}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#666666",
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
                    color: "#666666",
                    fontSize: "0.8125rem",
                    flex: 1,
                  }}
                >
                  This appears right below your name on your profile
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: headlineValue.length > 120 ? "#d32f2f" : "#9ca3af",
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
                backgroundColor: "#ffffff",
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
                    borderColor: "#0a66c2",
                  },
                },
                "&.Mui-focused": {
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#0a66c2",
                    borderWidth: "2px",
                  },
                },
              },
              "& .MuiInputLabel-root": {
                fontSize: "0.9375rem",
                fontWeight: 500,
                color: "#666666",
                "&.Mui-focused": {
                  color: "#0a66c2",
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
              backgroundColor: "#f9fafb",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <IconWrapper icon="mdi:lightbulb-outline" size={18} color="#0a66c2" />
              <Typography
                variant="caption"
                sx={{
                  color: "#000000",
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
                  color: "#666666",
                  fontSize: "0.8125rem",
                  mb: 0.75,
                  position: "relative",
                  "&::before": {
                    content: '"•"',
                    position: "absolute",
                    left: -16,
                    color: "#0a66c2",
                    fontWeight: "bold",
                  },
                }}
              >
                Include your current role or area of expertise
              </Box>
              <Box
                component="li"
                sx={{
                  color: "#666666",
                  fontSize: "0.8125rem",
                  mb: 0.75,
                  position: "relative",
                  "&::before": {
                    content: '"•"',
                    position: "absolute",
                    left: -16,
                    color: "#0a66c2",
                    fontWeight: "bold",
                  },
                }}
              >
                Use keywords relevant to your field
              </Box>
              <Box
                component="li"
                sx={{
                  color: "#666666",
                  fontSize: "0.8125rem",
                  position: "relative",
                  "&::before": {
                    content: '"•"',
                    position: "absolute",
                    left: -16,
                    color: "#0a66c2",
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
            borderTop: "1px solid rgba(0,0,0,0.08)",
            gap: { xs: 1, sm: 1.25 },
            flexDirection: { xs: "column-reverse", sm: "row" },
            backgroundColor: "#ffffff",
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
              color: "#666666",
              borderRadius: "24px",
              px: { xs: 3, sm: 3 },
              py: { xs: 1.125, sm: 0.875 },
              width: { xs: "100%", sm: "auto" },
              minWidth: { xs: "auto", sm: 100 },
              border: "1px solid rgba(0,0,0,0.12)",
              "&:hover": {
                backgroundColor: "#f3f2ef",
                borderColor: "rgba(0,0,0,0.2)",
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
              backgroundColor: "#0a66c2",
              borderRadius: "24px",
              px: { xs: 3, sm: 3.5 },
              py: { xs: 1.125, sm: 0.875 },
              width: { xs: "100%", sm: "auto" },
              minWidth: { xs: "auto", sm: 120 },
              boxShadow: "0 2px 4px rgba(10, 102, 194, 0.2)",
              "&:hover": {
                backgroundColor: "#004182",
                boxShadow: "0 4px 8px rgba(10, 102, 194, 0.3)",
              },
              "&:disabled": {
                backgroundColor: "#e5e7eb",
                color: "#9ca3af",
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
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTop: "2px solid #ffffff",
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
