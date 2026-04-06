"use client";

import { Box, Typography, Skeleton } from "@mui/material";
import Image from "next/image";
import { Noto_Sans_Arabic } from "next/font/google";
import { TextHoverEffect } from "@/components/ui/text-hover-effect";
import { authLayoutClient28Tokens } from "@/lib/auth/auth-layout-variants";
import { brandWordHighlightSx } from "./authBrandStyles";

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["600", "700"],
  display: "swap",
});

interface AuthRightPanelClient28Props {
  clientInfoLoading: boolean;
  sloganText: string;
  logoUrl: string;
  brandName: string;
}

export function AuthRightPanelClient28({
  clientInfoLoading,
  sloganText,
  logoUrl,
  brandName,
}: AuthRightPanelClient28Props) {
  const arabicFont = `${notoArabic.style.fontFamily}, "Noto Sans Arabic", sans-serif`;

  return (
    <Box
      sx={{
        flex: { xs: 0, md: "0 0 50%" },
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        height: "100vh",
        background:
          "linear-gradient(165deg, #0f172a 0%, #134e4a 42%, #0f172a 100%)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "8%",
            right: "12%",
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(45,212,191,0.18) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "5%",
            left: "8%",
            width: 380,
            height: 380,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(94,234,212,0.12) 0%, transparent 72%)",
            filter: "blur(50px)",
          }}
        />
      </Box>

      {/* Top: Arabic INUN + Arabic LMS hover effects */}
      <Box
        className={notoArabic.className}
        sx={{
          position: "relative",
          zIndex: 2,
          flexShrink: 0,
          width: "100%",
          maxWidth: 720,
          px: 3,
          pt: 3,
          pb: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box sx={{ width: "100%", height: 118, maxWidth: 560 }}>
          <TextHoverEffect
            text={authLayoutClient28Tokens.hoverBrandArabic}
            duration={0.3}
            fontSize={56}
            viewBox="0 0 520 120"
            fontFamily={arabicFont}
            direction="rtl"
            colorMode="onDark"
            className="w-full h-full"
          />
        </Box>
        <Box sx={{ width: "100%", height: 100, maxWidth: 680 }}>
          <TextHoverEffect
            text={authLayoutClient28Tokens.hoverLmsArabic}
            duration={0.35}
            fontSize={38}
            viewBox="0 0 960 130"
            fontFamily={arabicFont}
            direction="rtl"
            colorMode="onDark"
            className="w-full h-full"
          />
        </Box>
      </Box>

      {/* Center: logo, title, slogan — slightly above vertical center */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          maxWidth: 560,
          px: 4,
          gap: 2,
          textAlign: "center",
          minHeight: 0,
          transform: "translateY(clamp(-72px, -7vh, -32px))",
        }}
      >
        {clientInfoLoading ? (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Skeleton
              variant="rounded"
              sx={{
                bgcolor: "rgba(148,163,184,0.2)",
                width: authLayoutClient28Tokens.logoMaxWidthPx,
                height: authLayoutClient28Tokens.logoHeightMdPx,
                borderRadius: 2,
              }}
            />
            <Skeleton
              variant="text"
              sx={{ bgcolor: "rgba(148,163,184,0.2)", width: "85%", height: 48 }}
            />
            <Skeleton
              variant="text"
              sx={{ bgcolor: "rgba(148,163,184,0.15)", width: "70%", height: 22 }}
            />
          </Box>
        ) : (
          (logoUrl || brandName) && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1.25,
                width: "100%",
              }}
            >
              {logoUrl ? (
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    maxWidth: authLayoutClient28Tokens.logoMaxWidthPx,
                    height: { xs: 72, md: authLayoutClient28Tokens.logoHeightMdPx },
                    mx: "auto",
                  }}
                >
                  <Image
                    src={logoUrl}
                    alt={brandName || "Logo"}
                    fill
                    sizes={`${authLayoutClient28Tokens.logoMaxWidthPx}px`}
                    style={{ objectFit: "contain" }}
                    priority
                  />
                </Box>
              ) : null}
              {brandName ? (
                <Typography
                  component="p"
                  sx={{
                    m: 0,
                    fontSize: { md: "3.25rem", lg: "3.75rem" },
                    fontWeight: 800,
                    lineHeight: 1.12,
                    letterSpacing: "-0.02em",
                    color: "#f8fafc",
                  }}
                >
                  {brandName
                    .split(/\s+/)
                    .filter(Boolean)
                    .map((word, index, words) => (
                      <Box
                        key={`${word}-${index}`}
                        component="span"
                        sx={{
                          ...brandWordHighlightSx,
                          marginRight: index < words.length - 1 ? "0.35em" : 0,
                        }}
                      >
                        {word}
                      </Box>
                    ))}
                </Typography>
              ) : null}
            </Box>
          )
        )}

        <Typography
          variant="h2"
          component="div"
          sx={{
            fontSize: {
              md: authLayoutClient28Tokens.sloganFontSizeMd,
              lg: authLayoutClient28Tokens.sloganFontSizeLg,
            },
            fontWeight: 700,
            lineHeight: 1.45,
            color: "#e2e8f0",
            position: "relative",
            zIndex: 2,
            maxWidth: 440,
          }}
        >
          {sloganText.split(" ").map((word, index) => {
            if (word === "the" || word === "world") {
              return (
                <Box
                  key={index}
                  component="span"
                  sx={{
                    position: "relative",
                    display: "inline-block",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      top: "50%",
                      left: 0,
                      right: 0,
                      height: "40%",
                      background:
                        "linear-gradient(135deg, #f97316 0%, #ec4899 100%)",
                      borderRadius: "20px",
                      opacity: 0.3,
                      zIndex: -1,
                    },
                  }}
                >
                  {word}{" "}
                </Box>
              );
            }
            return <span key={index}>{word} </span>;
          })}
        </Typography>
      </Box>

      {/* Bottom: INUN — large type, anchored to viewport bottom */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          flexShrink: 0,
          width: "100%",
          maxWidth: 720,
          px: 3,
          pt: 0,
          pb: "max(0px, env(safe-area-inset-bottom, 0px))",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          minHeight: { md: "min(34vh, 300px)" },
          height: { md: "min(34vh, 300px)" },
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%",
            maxWidth: 640,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <TextHoverEffect
            text={authLayoutClient28Tokens.hoverBrandText}
            duration={0.3}
            fontSize={112}
            viewBox="0 0 520 200"
            textYPercent="76%"
            preserveAspectRatioProp="xMidYMax meet"
            colorMode="onDark"
            omitGhostLayer
            className="w-full h-full"
          />
        </Box>
      </Box>
    </Box>
  );
}
