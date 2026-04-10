"use client";

import { Box, Typography, Skeleton } from "@mui/material";
import Image from "next/image";
import { TextHoverEffect } from "@/components/ui/text-hover-effect";
import { authLayoutClient28Tokens } from "@/lib/auth/auth-layout-variants";
import { brandWordHighlightSx } from "./authBrandStyles";

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
        backgroundColor: "#0f172a",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "#0f172a",
          backgroundImage: "url(/images/inun-landing.jpg)",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Center: logo, title, slogan — nudged below midline for balance with bottom INUN */}
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
          maxWidth: 840,
          px: 4,
          pt: { md: 2 },
          gap: 2,
          textAlign: "center",
          minHeight: 0,
          transform: "translateY(clamp(28px, 4vh, 72px))",
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
                    height: { xs: 104, md: authLayoutClient28Tokens.logoHeightMdPx },
                    mx: "auto",
                    filter: [
                      "drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
                      "drop-shadow(0 5px 14px rgba(0,0,0,0.25))",
                      "drop-shadow(0 0 2px rgba(15,23,42,0.45))",
                    ].join(" "),
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
                    textShadow:
                      "0 2px 20px rgba(0,0,0,0.75), 0 1px 6px rgba(0,0,0,0.9), 0 0 1px rgba(15,23,42,1)",
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
            color: "#0a0a0a",
            position: "relative",
            zIndex: 2,
            maxWidth: 520,
            textShadow:
              "0 0 10px rgba(255,255,255,0.92), 0 0 3px rgba(255,255,255,1), 0 2px 6px rgba(255,255,255,0.75)",
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
