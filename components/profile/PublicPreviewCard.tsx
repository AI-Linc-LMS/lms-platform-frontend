"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { LoadingButton } from "@/components/common/LoadingButton";
import { ImageUrlDialog } from "./ImageUrlDialog";
import { ProfilePanel } from "./theme/surfaces";
import { PROFILE } from "./theme/profileTokens";

/**
 * The cover photo and avatar, demoted out of the page header.
 *
 * The old layout opened with a 220-400px full-bleed cover band, which was the single loudest
 * thing making this page look unlike the dashboard. Here the same two assets become a compact
 * "this is what other people see" preview in the right rail: still editable, no longer
 * deciding the quality of the screen. Both upload paths (POST profile picture / cover photo)
 * are unchanged, so the endpoints on feat/profile-image-upload stay load-bearing.
 */

interface PublicPreviewCardProps {
  userName: string;
  role?: string;
  headline?: string;
  location?: string;
  profilePicUrl?: string;
  coverPhotoUrl?: string;
  onEditProfilePicUrl?: (url: string) => Promise<void>;
  onUploadProfilePic?: (file: File) => Promise<void>;
  onEditCoverUrl?: (url: string) => Promise<void>;
  onUploadCover?: (file: File) => Promise<void>;
  onEditHeadline?: (headline: string) => Promise<void>;
}

export function PublicPreviewCard({
  userName,
  role,
  headline,
  location,
  profilePicUrl,
  coverPhotoUrl,
  onEditProfilePicUrl,
  onUploadProfilePic,
  onEditCoverUrl,
  onUploadCover,
  onEditHeadline,
}: PublicPreviewCardProps) {
  const { t } = useTranslation("common");
  const [coverDialogOpen, setCoverDialogOpen] = useState(false);
  const [picDialogOpen, setPicDialogOpen] = useState(false);
  const [headlineDialogOpen, setHeadlineDialogOpen] = useState(false);
  const [headlineValue, setHeadlineValue] = useState(headline || "");
  const [savingHeadline, setSavingHeadline] = useState(false);

  useEffect(() => {
    setHeadlineValue(headline || "");
  }, [headline]);

  return (
    <>
      <ProfilePanel sx={{ p: 0, overflow: "hidden" }}>
        {/* Cover band. The gradient fallback is the same night ramp as the hero, so an
            account with no upload still looks composed rather than empty. */}
        <Box
          sx={{
            position: "relative",
            height: 96,
            backgroundImage: coverPhotoUrl ? `url(${coverPhotoUrl})` : undefined,
            background: coverPhotoUrl
              ? undefined
              : "linear-gradient(135deg, #271a5c 0%, #4c1d95 55%, #7c3aed 100%)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(16,10,44,0.45) 0%, transparent 62%)",
            }}
          />
          {onEditCoverUrl && (
            <Button
              size="small"
              onClick={() => setCoverDialogOpen(true)}
              startIcon={<IconWrapper icon="mdi:image-edit-outline" size={15} />}
              sx={{
                position: "absolute",
                top: 10,
                insetInlineEnd: 10,
                minWidth: 0,
                textTransform: "none",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: PROFILE.ink,
                bgcolor: "rgba(255,255,255,0.92)",
                borderRadius: 999,
                px: 1.5,
                py: 0.5,
                "&:hover": { bgcolor: "#fff" },
              }}
            >
              {coverPhotoUrl ? t("profile.change") : t("profile.add")}
            </Button>
          )}
        </Box>

        <Box sx={{ px: 2.5, pb: 2.5 }}>
          <Stack direction="row" spacing={1.5} alignItems="flex-end" sx={{ mt: "-28px", position: "relative" }}>
            <Box sx={{ position: "relative", flexShrink: 0 }}>
              <Avatar
                src={profilePicUrl}
                alt={userName}
                sx={{
                  width: 64,
                  height: 64,
                  border: "3px solid #fff",
                  boxShadow: "0 6px 18px -8px rgba(16,10,44,0.55)",
                  bgcolor: PROFILE.violet,
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "1.4rem",
                }}
              >
                {userName?.[0]?.toUpperCase()}
              </Avatar>
              {onEditProfilePicUrl && (
                <Box
                  component="button"
                  aria-label={t("profile.editProfilePicture")}
                  onClick={() => setPicDialogOpen(true)}
                  sx={{
                    position: "absolute",
                    bottom: -2,
                    insetInlineEnd: -2,
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    border: "2px solid #fff",
                    bgcolor: PROFILE.violet,
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                    p: 0,
                    "&:hover": { bgcolor: "#6d28d9" },
                    "&:focus-visible": { outline: "none", boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${PROFILE.violet}` },
                  }}
                >
                  <IconWrapper icon="mdi:camera-outline" size={14} />
                </Box>
              )}
            </Box>

            <Box sx={{ minWidth: 0, pb: 0.25 }}>
              <Typography
                sx={{ fontWeight: 800, fontSize: "0.95rem", color: PROFILE.ink, lineHeight: 1.2, letterSpacing: "-0.3px" }}
              >
                {userName}
              </Typography>
              {role && <Typography sx={{ fontSize: "0.72rem", color: PROFILE.inkFaint }}>{role}</Typography>}
            </Box>
          </Stack>

          <Stack direction="row" spacing={0.5} alignItems="flex-start" sx={{ mt: 1.5 }}>
            <Typography
              sx={{
                flex: 1,
                minWidth: 0,
                fontSize: "0.8rem",
                lineHeight: 1.45,
                color: headline ? PROFILE.inkMuted : "#94a3b8",
                fontStyle: headline ? "normal" : "italic",
              }}
            >
              {headline || t("profile.addHeadline")}
            </Typography>
            {onEditHeadline && (
              <Box
                component="button"
                aria-label={t("profile.editHeadline")}
                onClick={() => {
                  setHeadlineValue(headline || "");
                  setHeadlineDialogOpen(true);
                }}
                sx={{
                  flexShrink: 0,
                  width: 24,
                  height: 24,
                  borderRadius: 1.5,
                  border: 0,
                  bgcolor: "transparent",
                  color: PROFILE.violet,
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                  p: 0,
                  "&:hover": { bgcolor: PROFILE.violetSoft },
                  "&:focus-visible": { outline: "none", boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${PROFILE.violet}` },
                }}
              >
                <IconWrapper icon="mdi:pencil" size={14} />
              </Box>
            )}
          </Stack>

          {location && (
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.75 }}>
              <IconWrapper icon="mdi:map-marker" size={13} color={PROFILE.inkFaint} />
              <Typography sx={{ fontSize: "0.72rem", color: PROFILE.inkFaint }}>{location}</Typography>
            </Stack>
          )}

          <Typography
            sx={{
              mt: 1.75,
              pt: 1.5,
              borderTop: `1px solid ${PROFILE.hairline}`,
              fontSize: "0.7rem",
              color: PROFILE.inkFaint,
              lineHeight: 1.5,
            }}
          >
            {t("profile.publicPreviewNote", {
              defaultValue: "This is how your profile appears to instructors and recruiters.",
            })}
          </Typography>
        </Box>
      </ProfilePanel>

      {onEditCoverUrl && (
        <ImageUrlDialog
          open={coverDialogOpen}
          onClose={() => setCoverDialogOpen(false)}
          onSave={onEditCoverUrl}
          onUpload={onUploadCover}
          title={t("profile.editCoverPhoto")}
          subtitle="Paste an image URL to use as your cover photo"
          currentImageUrl={coverPhotoUrl}
          placeholder="https://example.com/cover-image.jpg"
        />
      )}

      {onEditProfilePicUrl && (
        <ImageUrlDialog
          open={picDialogOpen}
          onClose={() => setPicDialogOpen(false)}
          onSave={onEditProfilePicUrl}
          onUpload={onUploadProfilePic}
          title={t("profile.editProfilePicture")}
          subtitle="Paste an image URL to use as your profile picture"
          currentImageUrl={profilePicUrl}
          placeholder="https://example.com/profile-picture.jpg"
        />
      )}

      <Dialog
        open={headlineDialogOpen}
        onClose={() => !savingHeadline && setHeadlineDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.05rem", color: PROFILE.ink }}>
          {t("profile.editHeadline")}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            value={headlineValue}
            onChange={(e) => setHeadlineValue(e.target.value)}
            placeholder={t("profile.addHeadline")}
            helperText={t("profile.headlineHelper")}
            slotProps={{ htmlInput: { maxLength: 220 } }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => {
              setHeadlineDialogOpen(false);
              setHeadlineValue(headline || "");
            }}
            disabled={savingHeadline}
            sx={{ textTransform: "none", fontWeight: 700, color: PROFILE.inkMuted, borderRadius: 999, px: 2.5 }}
          >
            {t("profile.cancel")}
          </Button>
          <LoadingButton
            variant="contained"
            loading={savingHeadline}
            loadingText={t("profile.saving")}
            onClick={async () => {
              if (!onEditHeadline) return;
              try {
                setSavingHeadline(true);
                await onEditHeadline(headlineValue.trim());
                setHeadlineDialogOpen(false);
              } finally {
                setSavingHeadline(false);
              }
            }}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              borderRadius: 999,
              px: 3,
              bgcolor: PROFILE.violet,
              "&:hover": { bgcolor: "#6d28d9" },
            }}
          >
            {t("profile.save")}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
