"use client";

import { useEffect, useState } from "react";
import { Box, Dialog, IconButton, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface ImageGalleryProps {
  urls: string[];
  /**
   * - "card"   - used inside ThreadCard preview, slightly shorter / capped.
   * - "detail" - used inside thread detail page, larger / more breathing room.
   */
  variant?: "card" | "detail";
}

/**
 * Instagram-style image rendering:
 *   1 image  → full-width, natural aspect (capped height)
 *   2 images → side-by-side equal halves
 *   3 images → 2/3 + 1/3 split (one big left, one stacked small right)
 *   4+ images → 2x2 grid, with "+N more" overlay on the 4th
 *
 * Clicking any image opens a fullscreen lightbox with prev/next arrows.
 */
export function ImageGallery({ urls, variant = "card" }: ImageGalleryProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const isDetail = variant === "detail";

  const cardMaxH = isDetail ? 520 : 380;
  const gap = isDetail ? 8 : 4;
  const radius = isDetail ? 12 : 10;
  const showCount = Math.min(urls.length, 4);
  const overflow = urls.length - showCount;

  useEffect(() => {
    if (lightboxIdx == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowRight") setLightboxIdx((i) => (i == null ? null : (i + 1) % urls.length));
      if (e.key === "ArrowLeft") setLightboxIdx((i) => (i == null ? null : (i - 1 + urls.length) % urls.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, urls.length]);

  if (urls.length === 0) return null;

  const tile = (idx: number, sx: object = {}) => {
    const url = urls[idx];
    const showOverlay = idx === 3 && overflow > 0;
    return (
      <Box
        key={`${url}-${idx}`}
        onClick={(e) => {
          e.stopPropagation();
          setLightboxIdx(idx);
        }}
        sx={{
          position: "relative",
          cursor: "zoom-in",
          overflow: "hidden",
          borderRadius: `${radius}px`,
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border-default)",
          ...sx,
        }}
      >
        <Box
          component="img"
          src={url}
          alt=""
          loading="lazy"
          sx={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.25s ease",
            "&:hover": { transform: "scale(1.02)" },
          }}
        />
        {showOverlay && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.55)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "1.4rem",
              pointerEvents: "none",
            }}
          >
            +{overflow}
          </Box>
        )}
      </Box>
    );
  };

  let grid: React.ReactNode;
  if (urls.length === 1) {
    grid = (
      <Box
        sx={{
          width: "100%",
          maxHeight: cardMaxH,
          minHeight: isDetail ? 240 : 180,
          display: "flex",
          overflow: "hidden",
          borderRadius: `${radius}px`,
          border: "1px solid var(--border-default)",
          backgroundColor: "var(--surface)",
        }}
      >
        <Box
          component="img"
          src={urls[0]}
          alt=""
          loading="lazy"
          onClick={(e) => {
            e.stopPropagation();
            setLightboxIdx(0);
          }}
          sx={{
            width: "100%",
            objectFit: "contain",
            cursor: "zoom-in",
            maxHeight: cardMaxH,
            display: "block",
          }}
        />
      </Box>
    );
  } else if (urls.length === 2) {
    grid = (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: `${gap}px`,
          height: isDetail ? 360 : 240,
        }}
      >
        {tile(0)}
        {tile(1)}
      </Box>
    );
  } else if (urls.length === 3) {
    grid = (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: `${gap}px`,
          height: isDetail ? 380 : 260,
        }}
      >
        {tile(0, { gridRow: "1 / span 2" })}
        {tile(1)}
        {tile(2)}
      </Box>
    );
  } else {
    grid = (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: `${gap}px`,
          height: isDetail ? 400 : 280,
        }}
      >
        {tile(0)}
        {tile(1)}
        {tile(2)}
        {tile(3)}
      </Box>
    );
  }

  return (
    <>
      {grid}

      <Dialog
        open={lightboxIdx !== null}
        onClose={() => setLightboxIdx(null)}
        maxWidth={false}
        PaperProps={{
          sx: {
            backgroundColor: "rgba(0,0,0,0.92)",
            boxShadow: "none",
            m: 0,
            maxWidth: "100vw",
            maxHeight: "100vh",
            width: "100vw",
            height: "100vh",
            borderRadius: 0,
            overflow: "hidden",
          },
        }}
      >
        {lightboxIdx !== null && (
          <Box
            sx={{
              position: "relative",
              width: "100vw",
              height: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 4,
            }}
            onClick={() => setLightboxIdx(null)}
          >
            {/* Close */}
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIdx(null);
              }}
              sx={{
                position: "absolute",
                top: 16,
                right: 16,
                color: "#fff",
                backgroundColor: "rgba(255,255,255,0.1)",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
                zIndex: 10,
              }}
            >
              <IconWrapper icon="mdi:close" size={20} />
            </IconButton>

            {/* Prev */}
            {urls.length > 1 && (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIdx((i) => (i == null ? 0 : (i - 1 + urls.length) % urls.length));
                }}
                sx={{
                  position: "absolute",
                  left: 16,
                  color: "#fff",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
                  zIndex: 10,
                }}
              >
                <IconWrapper icon="mdi:chevron-left" size={28} />
              </IconButton>
            )}

            {/* Image */}
            <Box
              component="img"
              src={urls[lightboxIdx]}
              alt=""
              onClick={(e) => e.stopPropagation()}
              sx={{
                maxWidth: "92vw",
                maxHeight: "88vh",
                objectFit: "contain",
                borderRadius: 1,
                boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
              }}
            />

            {/* Next */}
            {urls.length > 1 && (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIdx((i) => (i == null ? 0 : (i + 1) % urls.length));
                }}
                sx={{
                  position: "absolute",
                  right: 16,
                  color: "#fff",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
                  zIndex: 10,
                }}
              >
                <IconWrapper icon="mdi:chevron-right" size={28} />
              </IconButton>
            )}

            {/* Counter */}
            {urls.length > 1 && (
              <Typography
                sx={{
                  position: "absolute",
                  bottom: 24,
                  color: "rgba(255,255,255,0.85)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "12px",
                  backgroundColor: "rgba(0,0,0,0.5)",
                }}
              >
                {lightboxIdx + 1} / {urls.length}
              </Typography>
            )}
          </Box>
        )}
      </Dialog>
    </>
  );
}
