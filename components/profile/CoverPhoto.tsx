"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button } from "@mui/material";
import { motion } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ImageUrlDialog } from "./ImageUrlDialog";

interface CoverPhotoProps {
  coverPhotoUrl?: string;
  onEditCoverUrl?: (url: string) => Promise<void>;
}

export function CoverPhoto({ coverPhotoUrl, onEditCoverUrl }: CoverPhotoProps) {
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
          height: { xs: 220, sm: 280, md: 340, lg: 400 },
          overflow: "hidden",
          backgroundColor: coverPhotoUrl ? "transparent" : "var(--surface)",
          backgroundImage: coverPhotoUrl
            ? `linear-gradient(180deg, color-mix(in srgb, var(--font-primary) 15%, transparent) 0%, color-mix(in srgb, var(--font-primary) 40%, transparent) 100%), url(${coverPhotoUrl})`
            : "linear-gradient(135deg, color-mix(in srgb, var(--surface) 88%, var(--background)) 0%, color-mix(in srgb, var(--surface) 72%, var(--background)) 50%, color-mix(in srgb, var(--surface) 58%, var(--background)) 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          "&::after": coverPhotoUrl
            ? {}
            : {
                content: '""',
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(ellipse 80% 50% at 50% 100%, color-mix(in srgb, var(--accent-indigo) 16%, transparent) 0%, transparent 70%)",
                pointerEvents: "none",
              },
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Bottom gradient overlay for profile pic overlap */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "40%",
            background:
              "linear-gradient(to top, color-mix(in srgb, var(--font-primary) 50%, transparent) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        />
        {onEditCoverUrl && (
          <Box
            sx={{
              position: "absolute",
              top: { xs: 16, sm: 20 },
              right: { xs: 16, sm: 24 },
              zIndex: 2,
              opacity: { xs: 1, sm: hovered ? 1 : 0 },
              transition: "opacity 0.25s ease, transform 0.25s ease",
            }}
          >
            <Button
              variant="contained"
              startIcon={<IconWrapper icon="mdi:image-edit-outline" size={18} />}
              onClick={() => setUrlDialogOpen(true)}
              sx={{
                backgroundColor: "color-mix(in srgb, var(--background) 95%, transparent)",
                backdropFilter: "blur(12px)",
                color: "var(--font-primary)",
                textTransform: "none",
                fontWeight: 600,
                fontSize: { xs: "0.8125rem", sm: "0.9375rem" },
                borderRadius: "12px",
                px: { xs: 2, sm: 2.5 },
                py: { xs: 0.875, sm: 1 },
                boxShadow: "0 4px 20px color-mix(in srgb, var(--font-primary) 16%, transparent)",
                "&:hover": {
                  backgroundColor: "var(--background)",
                  boxShadow: "0 6px 24px color-mix(in srgb, var(--font-primary) 22%, transparent)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s ease",
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
          title={t("profile.editCoverPhoto")}
          subtitle="Paste an image URL to use as your cover photo"
          currentImageUrl={coverPhotoUrl}
          placeholder="https://example.com/cover-image.jpg"
        />
      )}
    </>
  );
}
