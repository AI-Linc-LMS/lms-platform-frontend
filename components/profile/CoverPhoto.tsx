"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button } from "@mui/material";
import { motion } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ImageUrlDialog } from "./ImageUrlDialog";
import { HERO_BG, HERO_RADIUS, PROFILE } from "./theme/profileTokens";

interface CoverPhotoProps {
  coverPhotoUrl?: string;
  onUploadCover?: (file: File) => Promise<void>;
  onEditCoverUrl?: (url: string) => Promise<void>;
}

export function CoverPhoto({ coverPhotoUrl, onEditCoverUrl, onUploadCover }: CoverPhotoProps) {
  const { t } = useTranslation("common");
  const [hovered, setHovered] = useState(false);
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);

  return (
    <>
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        sx={{
          position: "relative",
          width: "100%",
          // Was 220-400px, then 132-212px. Trimmed again now that the name sits below the
          // avatar rather than beside it: with a stacked header the banner and the identity
          // block add up, so a tall cover pushes the first real fact off the first screen.
          height: { xs: 104, sm: 132, md: 164 },
          overflow: "hidden",
          borderRadius: `${HERO_RADIUS * 8}px ${HERO_RADIUS * 8}px 0 0`,
          backgroundColor: coverPhotoUrl ? "transparent" : "transparent",
          backgroundImage: coverPhotoUrl
            ? `linear-gradient(180deg, rgba(15,10,40,0.12) 0%, rgba(15,10,40,0.42) 100%), url(${coverPhotoUrl})`
            : // No upload: the night-violet ramp from the hero, so an empty cover still
              // belongs to the product instead of looking like a missing image.
              HERO_BG,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Bottom scrim so the overlapping avatar and the name below it keep contrast against
            an arbitrary upload. Only needed when there IS an upload: the fallback ramp is
            already dark at the bottom. */}
        {coverPhotoUrl && (
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "45%",
              background: "linear-gradient(to top, rgba(15,10,40,0.5) 0%, transparent 100%)",
              pointerEvents: "none",
            }}
          />
        )}
        {onEditCoverUrl && (
          <Box
            sx={{
              position: "absolute",
              top: { xs: 12, sm: 16 },
              insetInlineEnd: { xs: 12, sm: 16 },
              zIndex: 2,
              opacity: { xs: 1, sm: hovered ? 1 : 0 },
              transition: "opacity 0.25s ease",
            }}
          >
            <Button
              variant="contained"
              startIcon={<IconWrapper icon="mdi:image-edit-outline" size={16} />}
              onClick={() => setUrlDialogOpen(true)}
              sx={{
                // Was a blur(12px) glass panel. Glassmorphism is on every AI-slop checklist
                // and DESIGN.md deletes it explicitly; a solid pill reads better on an
                // arbitrary photograph anyway.
                backgroundColor: "rgba(255,255,255,0.94)",
                color: PROFILE.ink,
                textTransform: "none",
                fontWeight: 700,
                fontSize: { xs: "0.75rem", sm: "0.8125rem" },
                borderRadius: 999,
                px: { xs: 1.75, sm: 2 },
                py: { xs: 0.625, sm: 0.75 },
                boxShadow: "0 4px 16px -6px rgba(15,10,40,0.45)",
                "&:hover": { backgroundColor: "#fff" },
                "&:focus-visible": { outline: "none", boxShadow: `0 0 0 2px rgba(15,10,40,0.6), 0 0 0 4px #fff` },
                transition: "background-color 0.15s ease",
              }}
              size="small"
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                {coverPhotoUrl ? t("profile.changeCoverPhoto") : t("profile.addCoverPhoto")}
              </Box>
              <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
                {coverPhotoUrl ? t("profile.change") : t("profile.add")}
              </Box>
            </Button>
          </Box>
        )}
      </Box>

      {onEditCoverUrl && (
        <ImageUrlDialog
          open={urlDialogOpen}
          onClose={() => setUrlDialogOpen(false)}
          onSave={onEditCoverUrl}
          onUpload={onUploadCover}
          title={t("profile.editCoverPhoto")}
          subtitle="Paste an image URL to use as your cover photo"
          currentImageUrl={coverPhotoUrl}
          placeholder="https://example.com/cover-image.jpg"
        />
      )}
    </>
  );
}
