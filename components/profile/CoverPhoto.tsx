"use client";

import { Box, Button } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useState } from "react";
import { ImageUploadDialog } from "./ImageUploadDialog";

interface CoverPhotoProps {
  coverPhotoUrl?: string;
  onEditCover?: (file: File) => Promise<void>;
}

export function CoverPhoto({ coverPhotoUrl, onEditCover }: CoverPhotoProps) {
  const [hovered, setHovered] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const handleUpload = async (file: File) => {
    if (onEditCover) {
      await onEditCover(file);
    }
  };

  return (
    <>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: { xs: 200, sm: 250, md: 300 },
          overflow: "hidden",
          backgroundColor: coverPhotoUrl ? "transparent" : "#e0e0e0", // LinkedIn-style gray background
          backgroundImage: coverPhotoUrl
            ? `url(${coverPhotoUrl})`
            : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          boxShadow: coverPhotoUrl ? "inset 0 -2px 8px rgba(0,0,0,0.05)" : "none",
          borderBottom: coverPhotoUrl ? "none" : "1px solid rgba(0,0,0,0.08)",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {onEditCover && (
          <Box
            sx={{
              position: "absolute",
              top: { xs: 12, sm: 16 },
              right: { xs: 12, sm: 16 },
              zIndex: 2,
              opacity: { xs: 1, sm: hovered ? 1 : 0 },
              transition: "opacity 0.2s ease",
            }}
          >
            <Button
              variant="contained"
              startIcon={<IconWrapper icon="mdi:camera" size={18} />}
              onClick={() => setUploadDialogOpen(true)}
              sx={{
                backgroundColor: "rgba(0, 0, 0, 0.65)",
                backdropFilter: "blur(8px)",
                color: "#ffffff",
                textTransform: "none",
                fontWeight: 600,
                fontSize: { xs: "0.8125rem", sm: "0.9375rem" },
                borderRadius: "24px",
                px: { xs: 1.5, sm: 2.5 },
                py: { xs: 0.75, sm: 1 },
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.85)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                },
                transition: "all 0.2s ease",
              }}
              size="small"
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                {coverPhotoUrl ? "Change cover photo" : "Add cover photo"}
              </Box>
              <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
                {coverPhotoUrl ? "Change" : "Add"}
              </Box>
            </Button>
          </Box>
        )}
      </Box>

      {onEditCover && (
        <ImageUploadDialog
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          onUpload={handleUpload}
          title="Edit Cover Photo"
          subtitle="Upload a cover photo to personalize your profile"
          currentImageUrl={coverPhotoUrl}
          aspectRatio={16 / 9} // Cover photos typically have a wide aspect ratio
          maxSizeMB={10}
        />
      )}
    </>
  );
}
