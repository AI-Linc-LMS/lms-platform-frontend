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
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
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
  const { push } = useInstantNavigation();
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
            // Icon only. A labelled "Change" pill was the largest, highest-contrast thing in
            // the card, which put the loudest emphasis on its least important action.
            <Box
              component="button"
              aria-label={coverPhotoUrl ? t("profile.changeCoverPhoto") : t("profile.addCoverPhoto")}
              onClick={() => setCoverDialogOpen(true)}
              sx={{
                position: "absolute",
                top: 10,
                insetInlineEnd: 10,
                width: 30,
                height: 30,
                p: 0,
                border: 0,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                color: PROFILE.ink,
                bgcolor: "rgba(255,255,255,0.9)",
                "&:hover": { bgcolor: "#fff" },
                "&:focus-visible": { outline: "none", boxShadow: `0 0 0 2px rgba(15,10,44,.6), 0 0 0 4px #fff` },
              }}
            >
              <IconWrapper icon="mdi:image-edit-outline" size={15} />
            </Box>
          )}
        </Box>

        {/* One left edge for everything.
            The name used to sit beside the avatar while the headline and location started
            back at the card's left edge, so the eye tracked across three different left
            margins in a 390px column. Avatar on its own line, all text aligned under it. */}
        <Box sx={{ px: 2.5, pb: 2.5 }}>
          <Box sx={{ mt: "-30px", position: "relative", width: "fit-content" }}>
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

          </Box>

          <Box sx={{ mt: 1.25, minWidth: 0 }}>
            <Typography
              sx={{ fontWeight: 800, fontSize: "1rem", color: PROFILE.ink, lineHeight: 1.2, letterSpacing: "-0.3px" }}
            >
              {userName}
            </Typography>
            {role && <Typography sx={{ fontSize: "0.72rem", color: PROFILE.inkFaint, mt: 0.25 }}>{role}</Typography>}
          </Box>

          {/* The headline's edit pencil sits inline right after the text rather than pushed
              to the far right, so it reads as attached to what it edits instead of opening a
              gap across the card. */}
          <Typography
            sx={{
              mt: 1.25,
              fontSize: "0.8rem",
              lineHeight: 1.45,
              color: headline ? PROFILE.inkMuted : "#94a3b8",
              fontStyle: headline ? "normal" : "italic",
            }}
          >
            {headline || t("profile.addHeadline")}
            {onEditHeadline && (
              <Box
                component="button"
                aria-label={t("profile.editHeadline")}
                onClick={() => {
                  setHeadlineValue(headline || "");
                  setHeadlineDialogOpen(true);
                }}
                sx={{
                  verticalAlign: "middle",
                  ml: 0.5,
                  width: 22,
                  height: 22,
                  borderRadius: 1.5,
                  border: 0,
                  bgcolor: "transparent",
                  color: PROFILE.violet,
                  cursor: "pointer",
                  display: "inline-grid",
                  placeItems: "center",
                  p: 0,
                  "&:hover": { bgcolor: PROFILE.violetSoft },
                  "&:focus-visible": { outline: "none", boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${PROFILE.violet}` },
                }}
              >
                <IconWrapper icon="mdi:pencil" size={13} />
              </Box>
            )}
          </Typography>

          {location && (
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.75 }}>
              <IconWrapper icon="mdi:map-marker" size={13} color={PROFILE.inkFaint} />
              <Typography sx={{ fontSize: "0.72rem", color: PROFILE.inkFaint }}>{location}</Typography>
            </Stack>
          )}

          {/* Replaces a divider plus a sentence explaining what the card was for. The button
              says the same thing in fewer words and, unlike the sentence, does something. */}
          <Box
            component="button"
            onClick={() => push("/profile/preview")}
            sx={{
              mt: 2,
              width: "100%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.75,
              py: 1,
              px: 1.5,
              borderRadius: 999,
              border: `1px solid ${PROFILE.violetBorder}`,
              bgcolor: PROFILE.violetSoft,
              color: PROFILE.violet,
              fontFamily: "inherit",
              fontWeight: 800,
              fontSize: "0.8125rem",
              cursor: "pointer",
              transition: "background .15s",
              "&:hover": { bgcolor: "#ede9fe" },
              "&:focus-visible": { outline: "none", boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${PROFILE.violet}` },
            }}
          >
            <IconWrapper icon="mdi:earth" size={16} />
            {t("profile.seePublicView", { defaultValue: "See public view" })}
          </Box>
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
